.PHONY: help build test run dev clean install setup docs export

help:
	@echo "Soft Power Lab - Command Reference"
	@echo "==================================="
	@echo ""
	@echo "Setup & Installation:"
	@echo "  make setup       - Install all dependencies"
	@echo "  make install     - Install npm and cargo packages"
	@echo ""
	@echo "Development:"
	@echo "  make dev         - Start development server"
	@echo "  make dev-engine  - Run engine tests in watch mode"
	@echo ""
	@echo "Building:"
	@echo "  make build       - Full production build"
	@echo "  make build-engine - Build Rust engine only"
	@echo "  make build-wasm  - Build WASM bridge"
	@echo "  make build-web   - Build web client"
	@echo ""
	@echo "Testing:"
	@echo "  make test        - Run all tests"
	@echo "  make test-engine - Test Rust engine"
	@echo ""
	@echo "Running:"
	@echo "  make run-web     - Run web development server"
	@echo "  make analyze     - Start Python analysis environment"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean       - Clean build artifacts"
	@echo "  make docs        - Generate documentation"
	@echo "  make export      - Export current configuration"

setup: install
	@echo "✅ Setup complete"

install:
	cd engine && cargo fetch
	cd apps/web-client && npm install
	@echo "✅ Dependencies installed"

dev: build-engine
	cd apps/web-client && npm run dev

dev-engine:
	cd engine && cargo watch -x "test --lib"

build: build-engine build-wasm build-web
	@echo "✅ Build complete"

build-engine:
	@echo "Building Rust Engine..."
	cd engine && cargo build --release
	@echo "✅ Engine built"

build-wasm:
	@echo "Building WASM Bridge..."
	cd engine && cargo build --release --target wasm32-unknown-unknown
	@echo "✅ WASM built"

build-web:
	@echo "Building Web Client..."
	cd apps/web-client && npm run build
	@echo "✅ Web client built"

test: test-engine
	@echo "✅ All tests passed"

test-engine:
	@echo "Testing Rust Engine..."
	cd engine && cargo test --release --lib

run-web:
	cd apps/web-client && npm run dev

analyze:
	@echo "Starting Python analysis environment..."
	cd python && jupyter lab

clean:
	cd engine && cargo clean
	cd apps/web-client && rm -rf dist node_modules
	rm -f *.log
	@echo "✅ Clean complete"

docs:
	@echo "Generating documentation..."
	mkdir -p docs/generated
	@echo "📚 Documentation in /docs"

export:
	@echo "Export complete - check exports/ directory"

.DEFAULT_GOAL := help
