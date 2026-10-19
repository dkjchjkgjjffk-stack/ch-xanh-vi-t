select cron.unschedule(jobid) from cron.job where jobname = 'sync-agricultural-prices';
select cron.schedule(
  'sync-agricultural-prices',
  '0 1 * * *',
  $job$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'price_sync_project_url')
        || '/functions/v1/sync-agricultural-prices',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-sync-token', (select decrypted_secret from vault.decrypted_secrets where name = 'price_sync_token')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 20000
    );
  $job$
);