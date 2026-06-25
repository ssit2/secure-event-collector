output "cloud_run_url" {
  description = "The URL of the deployed Cloud Run service"
  value       = google_cloud_run_v2_service.secure_event_collector_api.uri
}

output "artifact_registry_url" {
  description = "The URL of the Artifact Registry repository"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.security_events_repo.repository_id}"
}
output "github_actions_service_account" {
  description = "The Service Account email for GitHub Actions"
  value       = google_service_account.github_actions_sa.email
}

output "workload_identity_provider" {
  description = "The Workload Identity Provider ID for GitHub Actions"
  value       = google_iam_workload_identity_pool_provider.github_provider.name
}