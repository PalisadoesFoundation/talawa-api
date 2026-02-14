# frozen_string_literal: true

require 'simplecov'
require 'simplecov-cobertura'

SimpleCov.start do
  formatter SimpleCov::Formatter::CoberturaFormatter
  coverage_dir 'coverage'

  # Restrict coverage to scripts under scripts/install/
  track_files '../../scripts/install/**/*.sh'
  add_filter do |source_file|
    !source_file.filename.include?('/scripts/install/')
  end
end
