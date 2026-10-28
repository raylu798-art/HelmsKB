param([Parameter(Mandatory)][string]$RuntimePath,[string]$Compiler='p006-helmskb-test-compiler-v2')
$ErrorActionPreference='Stop'
$script:DockerExecutable=(Get-Command docker -CommandType Application).Source
$postgres='p006-helmskb-test-postgres'
if($Compiler -notmatch '^p006-helmskb-test-'){throw 'Compiler must belong to P006/test'}
$run=Get-Date -Format 'yyyyMMddHHmmss'
function Docker {param([Parameter(ValueFromRemainingArguments=$true)][string[]]$Arguments) $result=& $script:DockerExecutable @Arguments;if($LASTEXITCODE -ne 0){throw "Docker operation failed: $($Arguments[0])"};return $result}
function Sql([string]$Database,[string]$Text){Docker @('exec',$postgres,'psql','-X','-v','ON_ERROR_STOP=1','-U','p006_test','-d',$Database,'-Atc',$Text)}
function Migrate([string]$Database,[int]$Version){
 if($Database -notmatch '^p006_[a-z0-9_]+$'){throw 'Invalid fixture database'}
 # Secrets are expanded inside the private compiler, never in host arguments.
 $script='set -e; source /output/.env; /go/bin/migrate -path /src/migrations/versioned -database "postgres://p006_test:${DB_PASSWORD}@postgres:5432/'+$Database+'?sslmode=disable" goto '+$Version
 Docker @('exec',$Compiler,'bash','-c',$script)|Out-Null
}
$records=@()
foreach($baseline in @(118,120)){
 $database="p006_upgrade${baseline}_$run";$restored="p006_restore${baseline}_$run"
 Docker @('exec',$postgres,'createdb','-U','p006_test',$database)|Out-Null
 Migrate $database $baseline
 $seed=@'
INSERT INTO tenants(id,name,description,api_key,business) VALUES(606000,'HelmsKB synthetic upgrade fixture','P006/test only','synthetic-not-a-real-credential','test');
INSERT INTO knowledge_bases(id,tenant_id,name,embedding_model_id,summary_model_id,rerank_model_id) VALUES('60000000-0000-0000-0000-000000000001',606000,'Synthetic migration knowledge','','','');
INSERT INTO knowledges(id,tenant_id,knowledge_base_id,type,title,source,parse_status) VALUES('60000000-0000-0000-0000-000000000002',606000,'60000000-0000-0000-0000-000000000001','manual','P006 synthetic procedure','synthetic','completed');
'@
 Sql $database $seed|Out-Null
 $query="SELECT md5(string_agg(id||title||source,',' ORDER BY id)) FROM knowledges WHERE tenant_id=606000"
 $before=Sql $database $query
 $backup="/tmp/p006-upgrade${baseline}-$run.dump"
 Docker @('exec',$postgres,'pg_dump','-U','p006_test','-Fc','-f',$backup,$database)|Out-Null
 $hostBackup=Join-Path $RuntimePath "backups/upgrade${baseline}-$run.dump"
 Docker @('cp',"${postgres}:$backup",$hostBackup)|Out-Null
 Migrate $database 134
 $version=(Sql $database 'SELECT version||'':''||dirty FROM schema_migrations').Trim()
 if($version -ne '134:false' -or (Sql $database $query) -ne $before){throw 'Upgrade version or synthetic data changed'}
 Sql $database "SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='default_settings'"|Out-Null
 Docker @('exec',$postgres,'createdb','-U','p006_test',$restored)|Out-Null
 Docker @('exec',$postgres,'pg_restore','-U','p006_test','-d',$restored,'--exit-on-error',$backup)|Out-Null
 $restoredVersion=(Sql $restored 'SELECT version||'':''||dirty FROM schema_migrations').Trim()
 if($restoredVersion -ne "${baseline}:false" -or (Sql $restored $query) -ne $before){throw 'Independent database restore mismatch'}
 $records+=[ordered]@{baseline=$baseline;target=134;database=$database;restoredDatabase=$restored;version=$version;restoredVersion=$restoredVersion;syntheticDataHash=$before;backupSha256=(Get-FileHash -LiteralPath $hostBackup -Algorithm SHA256).Hash;upgrade='passed';databaseRestore='passed'}
}
$fresh="p006_fresh_$run";Docker @('exec',$postgres,'createdb','-U','p006_test',$fresh)|Out-Null;Migrate $fresh 134
if((Sql $fresh 'SELECT version||'':''||dirty FROM schema_migrations').Trim() -ne '134:false'){throw 'Fresh migration mismatch'}
$evidence=[ordered]@{environment='P006/test';checkedAt=(Get-Date).ToString('o');freshDatabase=$fresh;freshTarget=134;upgrades=$records;dataSource='independent synthetic P006 fixtures; no P005 data copied'}
$evidence|ConvertTo-Json -Depth 20|Set-Content -LiteralPath (Join-Path $RuntimePath 'evidence/migrations.json') -Encoding utf8NoBOM
$evidence|ConvertTo-Json -Depth 20
