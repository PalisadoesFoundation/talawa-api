# frozen_string_literal: true

require 'simplecov'
require 'simplecov-cobertura'

SimpleCov.start do
  # Output Cobertura XML for Codecov
  formatter SimpleCov::Formatter::CoberturaFormatter

  # Track coverage for install scripts (relative to tests/install)
  track_files '../../scripts/install/**/*.sh'

  # Set coverage directory
  coverage_dir 'coverage'

  # Add filter to exclude test files from coverage
  add_filter '/tests/'
end
