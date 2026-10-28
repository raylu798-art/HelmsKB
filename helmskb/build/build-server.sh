#!/usr/bin/env bash
set -euo pipefail
cd /src
test -f helmskb-generated-source.json
export GOMAXPROCS=2 GOFLAGS='-p=2' CARGO_BUILD_JOBS=2 GOSUMDB=sum.golang.org
export GOPROXY="${GOPROXY:-https://goproxy.cn,direct}"
source_commit=$(python3 -c 'import json;print(json.load(open("frontend/public/helmskb-build.json"))["sourceCommit"])')
version=$(python3 -c 'import json;print(json.load(open("frontend/public/helmskb-build.json"))["distributionVersion"])')
mkdir -p /output/runtime
bash scripts/build-anydoc-lib.sh
CGO_ENABLED=1 go test ./internal/productdocs ./internal/agent/... ./internal/handler/... ./internal/application/service/... ./internal/models/runtime
build_time=$(date -u +%Y-%m-%dT%H:%M:%SZ)
go_version=$(go version | awk '{print $3}')
ldflags="-w -s -X github.com/Tencent/WeKnora/internal/handler.Version=$version -X github.com/Tencent/WeKnora/internal/handler.Edition=standard -X github.com/Tencent/WeKnora/internal/handler.CommitID=$source_commit -X github.com/Tencent/WeKnora/internal/handler.BuildTime=$build_time -X github.com/Tencent/WeKnora/internal/handler.GoVersion=$go_version -X google.golang.org/protobuf/reflect/protoregistry.conflictPolicy=warn"
CGO_ENABLED=1 CGO_CFLAGS='-Wno-deprecated-declarations' go build -tags anydoc -ldflags "$ldflags" -o /output/runtime/WeKnora ./cmd/server
go install -tags postgres github.com/golang-migrate/migrate/v4/cmd/migrate@v4.19.1
cp /go/bin/migrate /output/runtime/migrate
go run cmd/download/duckdb/duckdb.go
cp -R /root/.duckdb /output/runtime/duckdb
cp -R /go/pkg/mod/github.com/yanyiwu /output/runtime/yanyiwu
cp -R config scripts migrations /output/runtime/
mkdir -p /output/runtime/dataset
cp -R dataset/samples /output/runtime/dataset/
bash scripts/copy-licenses.sh /output/runtime/license-bundle
cp frontend/public/helmskb-build.json /output/runtime/
sha256sum /output/runtime/WeKnora /output/runtime/migrate
