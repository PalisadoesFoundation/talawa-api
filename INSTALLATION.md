# Talawa-API Installation

Installation documentation can be found at these locations:

1. Online at https://docs-api.talawa.io/docs/installation
1. In the local repository at [INSTALLATION.md](docs/docs/docs/getting-started/installation.md) which is the source file for the web page.

## Python Environment Setup

Some pre-commit checks require Python. Follow these steps to set up your Python environment:

### Prerequisites
- Python 3.9 or higher (Python 3.11 recommended)

### Installation Steps

1. **Verify Python Installation**
```bash
   python3 --version
   # Should show Python 3.9 or higher
```

2. **Install Python Dependencies**
```bash
   # From the root of the talawa-api repository
   python3 -m pip install --upgrade pip
   pip install -r .github/workflows/requirements.txt
```

These dependencies are required for pre-commit hooks that check:
- Code formatting compliance (Biome)
- Docstring quality
- Sanitization rules
- Code coverage annotations
- TypeScript ignore comments
- Test skip commands

The pre-commit hooks will automatically run these checks when you commit code.