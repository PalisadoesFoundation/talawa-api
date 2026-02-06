# frozen_string_literal: true

require 'simplecov'
require 'simplecov-cobertura'

SimpleCov.start do
  # Output both HTML and Cobertura XML for Codecov
  formatter SimpleCov::Formatter::MultiFormatter.new([
    SimpleCov::Formatter::HTMLFormatter,
    SimpleCov::Formatter::CoberturaFormatter
  ])

  # Set coverage directory (relative to working directory)
  coverage_dir 'coverage'

  # Add filter to exclude test files from coverage
  add_filter %r{\.test\.sh$}
  add_filter %r{/tests/}
end
