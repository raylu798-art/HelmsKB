FROM public.ecr.aws/docker/library/rust:1.90-bookworm@sha256:3914072ca0c3b8aad871db9169a651ccfce30cf58303e5d6f2db16d1d8a7e58f AS rust
FROM node:24-bookworm-slim@sha256:ba849c60be29959425b8734d57b8b4b7d56f98edd9504c9af091d5281095a71e AS node
FROM public.ecr.aws/docker/library/golang:1.26.10-bookworm@sha256:632dff7351799a5a9954a48dc06670ade72ee44e8c351cdc0e5a57af2fea21af
COPY --from=rust /usr/local/cargo /usr/local/cargo
COPY --from=rust /usr/local/rustup /usr/local/rustup
COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/npm
ENV RUSTUP_HOME=/usr/local/rustup CARGO_HOME=/usr/local/cargo PATH=/usr/local/cargo/bin:$PATH GOMAXPROCS=2 CARGO_BUILD_JOBS=2 GOSUMDB=sum.golang.org
RUN apt-get update && apt-get install -y --no-install-recommends libsqlite3-dev python3 python3-venv ca-certificates curl git make build-essential pkg-config cmake && rm -rf /var/lib/apt/lists/* && ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm && ln -s /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx && rustup toolchain install 1.99.1 --profile minimal
WORKDIR /src
