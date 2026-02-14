# frozen_string_literal: true

require 'simplecov'
require 'simplecov-cobertura'

# Configure only; bashcov calls SimpleCov.start. Calling start here would cause
# "coverage measurement is already setup" when bashcov starts.
# root set so Cobertura paths are repo-relative (scripts/install/...) and match codecov.yml flag paths.
# coverage_dir under root so CI finds tests/install/coverage/coverage.xml and uploads with install flag.
SimpleCov.configure do
  command_name 'Install Script Tests'
  root File.expand_path('../..', __dir__)
  formatter SimpleCov::Formatter::CoberturaFormatter
  coverage_dir 'tests/install/coverage'

  # Restrict coverage to scripts under scripts/install/
  track_files 'scripts/install/**/*.sh'
  add_filter do |source_file|
    !source_file.filename.include?('/scripts/install/')
  end
end
