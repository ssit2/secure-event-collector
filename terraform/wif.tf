variable "github_repository" {
  description = "The GitHub repository in the format 'owner/repo' that is allowed to assume the deployer role."
  type        = string
  default     = "ssit2/secure-event-collector" #     
}
# Create a Service Account for GitHub Actions deployment
resource "google_service_account" "github_actions_sa" {
  project      = var.project_id
  account_id   = "github-actions-deployer"
  display_name = "Service Account for GitHub Actions CI/CD"
}

# Create a Workload Identity Pool
resource "google_iam_workload_identity_pool" "github_pool" {
  project                   = var.project_id
  workload_identity_pool_id = "github-actions-pool"
  display_name              = "GitHub Actions Pool"
  description               = "Workload Identity Pool for GitHub Actions"
}

# Create a Workload Identity Provider
resource "google_iam_workload_identity_pool_provider" "github_provider" {
  project                            = var.project_id
  workload_identity_pool_id          = google_iam_workload_identity_pool.github_pool.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-actions-provider"
  display_name                       = "GitHub Actions Provider"

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.actor"      = "assertion.actor"
    "attribute.repository" = "assertion.repository"
  }

  # Defense-in-Depth: Restrict token evaluation to the specific repo
  attribute_condition = "assertion.repository == '${var.github_repository}'"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

# Bind the GitHub Action service account to the Workload Identity Provider
# Restrict access to only the specific GitHub repository via assertion.repository
resource "google_service_account_iam_member" "github_actions_wif_binding" {
  service_account_id = google_service_account.github_actions_sa.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github_pool.name}/attribute.repository/${var.github_repository}"
}

# Grant roles/artifactregistry.writer on the security-events-repo repository (Least Privilege)
resource "google_artifact_registry_repository_iam_member" "registry_writer" {
  project    = var.project_id
  location   = var.region
  repository = google_artifact_registry_repository.security_events_repo.name
  role       = "roles/artifactregistry.writer"
  member     = "serviceAccount:${google_service_account.github_actions_sa.email}"
}

# Grant roles/run.developer on the secure-event-collector-api service (Least Privilege)
resource "google_cloud_run_v2_service_iam_member" "run_developer" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.secure_event_collector_api.name
  role     = "roles/run.developer"
  member   = "serviceAccount:${google_service_account.github_actions_sa.email}"
}

# Grant roles/iam.serviceAccountUser on the Cloud Run runtime service account (Least Privilege)
resource "google_service_account_iam_member" "runtime_sa_user" {
  service_account_id = google_service_account.cloud_run_sa.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.github_actions_sa.email}"
}