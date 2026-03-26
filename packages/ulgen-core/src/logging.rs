use std::io;
use tracing::Level;
use tracing_subscriber::{
    EnvFilter,
    fmt::{self, format::FmtSpan},
    layer::SubscriberExt,
    registry::Registry,
};

/// Logging configuration for ULGEN
#[derive(Debug, Clone)]
pub struct LoggingConfig {
    /// Log level (trace, debug, info, warn, error)
    pub level: Level,
    /// Whether to include file and line numbers
    pub with_file: bool,
    /// Whether to include thread names
    pub with_thread_names: bool,
    /// Whether to include target module paths
    pub with_target: bool,
    /// Whether to use JSON format (for structured logging)
    pub json_format: bool,
    /// Whether to log spans (function entry/exit)
    pub with_spans: bool,
    /// Environment filter for fine-grained control
    pub env_filter: Option<String>,
}

impl Default for LoggingConfig {
    fn default() -> Self {
        Self {
            level: Level::INFO,
            with_file: cfg!(debug_assertions),
            with_thread_names: false,
            with_target: true,
            json_format: false,
            with_spans: cfg!(debug_assertions),
            env_filter: None,
        }
    }
}

impl LoggingConfig {
    /// Create a new logging configuration
    pub fn new() -> Self {
        Self::default()
    }

    /// Set the log level
    pub fn level(mut self, level: Level) -> Self {
        self.level = level;
        self
    }

    /// Enable/disable file and line numbers
    pub fn with_file(mut self, enabled: bool) -> Self {
        self.with_file = enabled;
        self
    }

    /// Enable/disable thread names
    pub fn with_thread_names(mut self, enabled: bool) -> Self {
        self.with_thread_names = enabled;
        self
    }

    /// Enable/disable target module paths
    pub fn with_target(mut self, enabled: bool) -> Self {
        self.with_target = enabled;
        self
    }

    /// Enable/disable JSON format
    pub fn json_format(mut self, enabled: bool) -> Self {
        self.json_format = enabled;
        self
    }

    /// Enable/disable span logging
    pub fn with_spans(mut self, enabled: bool) -> Self {
        self.with_spans = enabled;
        self
    }

    /// Set environment filter for fine-grained control
    /// Example: "ulgen_core=debug,aws_sdk_ec2=info"
    pub fn env_filter<S: Into<String>>(mut self, filter: S) -> Self {
        self.env_filter = Some(filter.into());
        self
    }

    /// Create a development configuration with verbose logging
    pub fn development() -> Self {
        Self {
            level: Level::DEBUG,
            with_file: true,
            with_thread_names: true,
            with_target: true,
            json_format: false,
            with_spans: true,
            env_filter: Some("ulgen_core=debug,ulgen_desktop=debug".to_string()),
        }
    }

    /// Create a production configuration with structured logging
    pub fn production() -> Self {
        Self {
            level: Level::INFO,
            with_file: false,
            with_thread_names: false,
            with_target: false,
            json_format: true,
            with_spans: false,
            env_filter: Some("ulgen_core=info,warn".to_string()),
        }
    }

    /// Initialize the global tracing subscriber
    pub fn init(self) -> Result<(), Box<dyn std::error::Error + Send + Sync + 'static>> {
        let registry = Registry::default();

        // Create environment filter
        let env_filter = if let Some(filter) = &self.env_filter {
            EnvFilter::try_new(filter)?
        } else {
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| EnvFilter::new(self.level.to_string()))
        };

        // Configure span events
        let span_events = if self.with_spans {
            FmtSpan::NEW | FmtSpan::CLOSE
        } else {
            FmtSpan::NONE
        };

        if self.json_format {
            // JSON formatter for structured logging
            let json_layer = fmt::Layer::new()
                .json()
                .with_span_events(span_events)
                .with_file(self.with_file)
                .with_line_number(self.with_file)
                .with_thread_names(self.with_thread_names)
                .with_target(self.with_target)
                .with_writer(io::stdout);

            let subscriber = registry.with(env_filter).with(json_layer);
            tracing::subscriber::set_global_default(subscriber)?;
        } else {
            // Human-readable formatter for development
            let fmt_layer = fmt::Layer::new()
                .with_span_events(span_events)
                .with_file(self.with_file)
                .with_line_number(self.with_file)
                .with_thread_names(self.with_thread_names)
                .with_target(self.with_target)
                .with_writer(io::stdout);

            let subscriber = registry.with(env_filter).with(fmt_layer);
            tracing::subscriber::set_global_default(subscriber)?;
        }

        Ok(())
    }
}

/// Initialize logging with default configuration
pub fn init() -> Result<(), Box<dyn std::error::Error + Send + Sync + 'static>> {
    LoggingConfig::default().init()
}

/// Initialize logging for development
pub fn init_dev() -> Result<(), Box<dyn std::error::Error + Send + Sync + 'static>> {
    LoggingConfig::development().init()
}

/// Initialize logging for production
pub fn init_prod() -> Result<(), Box<dyn std::error::Error + Send + Sync + 'static>> {
    LoggingConfig::production().init()
}

/// Logging macros for structured data
#[macro_export]
macro_rules! log_operation {
    ($level:ident, $operation:expr, $($key:ident = $value:expr),*) => {
        tracing::$level!(
            operation = $operation,
            $($key = $value,)*
        );
    };
}

#[macro_export]
macro_rules! log_provider_operation {
    ($level:ident, $provider:expr, $operation:expr, $($key:ident = $value:expr),*) => {
        tracing::$level!(
            provider = $provider,
            operation = $operation,
            $($key = $value,)*
        );
    };
}

#[macro_export]
macro_rules! log_error {
    ($error:expr, $($key:ident = $value:expr),*) => {
        tracing::error!(
            error = %$error,
            error_type = std::any::type_name_of_val(&$error),
            $($key = $value,)*
        );
    };
}

/// Performance measurement utilities
pub struct OperationTimer {
    start: std::time::Instant,
    operation: String,
}

impl OperationTimer {
    /// Start timing an operation
    pub fn start<S: Into<String>>(operation: S) -> Self {
        let operation = operation.into();
        tracing::debug!(operation = %operation, "Starting operation");

        Self {
            start: std::time::Instant::now(),
            operation,
        }
    }

    /// Finish timing and log the duration
    pub fn finish(self) {
        let duration = self.start.elapsed();
        tracing::info!(
            operation = %self.operation,
            duration_ms = duration.as_millis(),
            "Operation completed"
        );
    }

    /// Finish timing with additional context
    pub fn finish_with<F>(self, _f: F)
    where
        F: FnOnce(&mut tracing::Event<'_>),
    {
        let duration = self.start.elapsed();
        tracing::info!(
            operation = %self.operation,
            duration_ms = duration.as_millis(),
            "Operation completed"
        );
    }
}

/// Convenience macro for timing operations
#[macro_export]
macro_rules! time_operation {
    ($operation:expr, $block:block) => {{
        let timer = $crate::logging::OperationTimer::start($operation);
        let result = $block;
        timer.finish();
        result
    }};
}

#[cfg(test)]
mod tests {
    use super::*;
    use tracing::Level;

    #[test]
    fn test_default_config() {
        let config = LoggingConfig::default();
        assert_eq!(config.level, Level::INFO);
        assert_eq!(config.json_format, false);
    }

    #[test]
    fn test_development_config() {
        let config = LoggingConfig::development();
        assert_eq!(config.level, Level::DEBUG);
        assert_eq!(config.with_file, true);
        assert_eq!(config.with_spans, true);
    }

    #[test]
    fn test_production_config() {
        let config = LoggingConfig::production();
        assert_eq!(config.level, Level::INFO);
        assert_eq!(config.json_format, true);
        assert_eq!(config.with_spans, false);
    }

    #[test]
    fn test_config_builder() {
        let config = LoggingConfig::new()
            .level(Level::WARN)
            .with_file(true)
            .json_format(true)
            .env_filter("test=debug");

        assert_eq!(config.level, Level::WARN);
        assert_eq!(config.with_file, true);
        assert_eq!(config.json_format, true);
        assert_eq!(config.env_filter, Some("test=debug".to_string()));
    }
}
