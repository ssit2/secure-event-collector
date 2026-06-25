locals {
  services = [
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "iam.googleapis.com"
  ]
}

# Enable GCP Services
resource "google_project_service" "enabled_services" {
  for_each = toset(local.services)
  project  = var.project_id
  service  = each.key

  disable_on_destroy = false
}

# Artifact Registry Repository
resource "google_artifact_registry_repository" "security_events_repo" {
  project       = var.project_id
  location      = var.region
  repository_id = "security-events-repo"
  description   = "Docker repository for Security Event API container images"
  format        = "DOCKER"

  depends_on = [google_project_service.enabled_services]
}

# Service Account for Cloud Run runtime (Least Privilege)
resource "google_service_account" "cloud_run_sa" {
  project      = var.project_id
  account_id   = "secure-event-api-runner"
  display_name = "Cloud Run runtime Service Account for Secure Event Collector API"

  depends_on = [google_project_service.enabled_services]
}

# Cloud Run Service (v2)
resource "google_cloud_run_v2_service" "secure_event_collector_api" {
  name     = "secure-event-collector-api"
  location = var.region
  project  = var.project_id
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.cloud_run_sa.email

    containers {
      image = "us-central1-docker.pkg.dev/project-d2917da9-e732-4731-944/security-events-repo/secure-api:v1"
      ports {
        container_port = 8080
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 2
    }
  }

  depends_on = [google_project_service.enabled_services]
}

# Allow public access for initial testing
resource "google_cloud_run_v2_service_iam_member" "noauth" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.secure_event_collector_api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
