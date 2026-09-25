from urllib.parse import urlparse


class LinkedInJobProvider:
    """Permitted handoff only: users paste a URL and finish in their browser."""

    @staticmethod
    def validate_job_url(url: str) -> str:
        parsed = urlparse(url)
        if parsed.scheme not in {"http", "https"} or parsed.netloc.lower() not in {"linkedin.com", "www.linkedin.com"}:
            raise ValueError("Use a valid LinkedIn job URL")
        return url

    @staticmethod
    def open_url(url: str) -> str:
        return LinkedInJobProvider.validate_job_url(url)
