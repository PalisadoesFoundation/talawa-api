# frozen_string_literal: true

require 'simplecov'
require 'simplecov-cobertura'

SimpleCov.start do
  # Output Cobertura XML for Codecov
  formatter SimpleCov::Formatter::CoberturaFormatter

  # Set coverage directory
  coverage_dir 'coverage'

  # Track only the install scripts (not test files or temp files)
  track_files '../../scripts/install/**/*.sh'

  # Filter out everything except scripts/install
  add_filter do |source_file|
    !source_file.filename.include?('/scripts/install/')
  end
end
