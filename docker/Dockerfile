FROM rust:1.93-bookworm AS builder

RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the whole repo rather than selected directories: the tree uses symlinks
# that cross top-level directory boundaries, so copying only some of them leaves
# dangling links.
#
#   examples/custom_plugin          declared workspace member in Cargo.toml
#   crates/bitview_website/website  symlink -> ../../website
#   website/scripts/modules         symlink -> ../../modules
#
# include_dir! walks the embedded directory eagerly, so any dangling link inside
# it panics the proc macro at compile time.
COPY . .

RUN cargo build --release --locked -p bitviewd

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y ca-certificates procps && rm -rf /var/lib/apt/lists/*

RUN useradd -m -s /bin/bash bitview

COPY --from=builder /app/target/release/bitviewd /usr/local/bin/bitviewd

USER bitview

RUN mkdir -p /home/bitview/.bitview

EXPOSE 3110

WORKDIR /home/bitview

ENTRYPOINT ["bitviewd"]
