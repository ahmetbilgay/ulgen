use anyhow::Result;
use sqlx::SqlitePool;
use ulgen_api_proto::UiPreferences;

#[derive(Clone)]
pub struct LocalStateStore {
    pool: SqlitePool,
}

impl LocalStateStore {
    pub async fn connect(database_url: &str) -> Result<Self> {
        let pool = SqlitePool::connect(database_url).await?;
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS ui_preferences (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                payload TEXT NOT NULL
            )
            "#,
        )
        .execute(&pool)
        .await?;

        Ok(Self { pool })
    }

    pub async fn save_preferences(&self, preferences: &UiPreferences) -> Result<()> {
        let payload = serde_json::to_string(preferences)?;
        sqlx::query(
            r#"
            INSERT INTO ui_preferences (id, payload)
            VALUES (1, ?1)
            ON CONFLICT(id) DO UPDATE SET payload = excluded.payload
            "#,
        )
        .bind(payload)
        .execute(&self.pool)
        .await?;

        Ok(())
    }
}
