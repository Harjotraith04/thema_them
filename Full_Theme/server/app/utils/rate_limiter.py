import time
import threading
from typing import Dict, Any
import logging
import uuid

logger = logging.getLogger(__name__)


class SimpleRateLimiter:
    """Simplified rate limiter with exponential backoff for LLM API calls."""

    def __init__(self):
        self._locks: Dict[str, threading.Lock] = {}
        self._provider_status: Dict[str, Dict[str, Any]] = {}

        # Exponential backoff settings
        self._base_delay = 5.0
        self._max_delay = 120.0
        self._reset_after = 300.0  # Reset status after 5 minutes of success
        self._max_attempts = 15  # Max attempts per individual operation

    def _get_lock(self, provider: str) -> threading.Lock:
        """Get or create a lock for the given provider."""
        if provider not in self._locks:
            self._locks[provider] = threading.Lock()
        return self._locks[provider]

    def _calculate_delay(self, attempt_count: int) -> float:
        """Calculate exponential backoff delay for a specific attempt count."""
        if attempt_count <= 0:
            return 0.0

        delay = self._base_delay * (2 ** (attempt_count - 1))
        return min(delay, self._max_delay)

    def _should_reset_provider_status(self, provider: str) -> bool:
        """Check if we should reset the provider status."""
        if provider not in self._provider_status:
            return True

        status = self._provider_status[provider]
        last_error = status.get('last_error_time', 0)
        return time.time() - last_error > self._reset_after

    def _is_rate_limit_error(self, error_msg: str, exception: Exception) -> bool:
        """Check if an error is a rate limit/quota error."""
        rate_limit_keywords = [
            'quota', 'exceeded', 'limit', 'rate', 'too many requests',
            'billing', '429', 'retry', 'backoff'
        ]

        # Check error message
        if any(keyword in error_msg for keyword in rate_limit_keywords):
            return True

        # Check HTTP status codes
        try:
            if hasattr(exception, 'status_code') and str(getattr(exception, 'status_code', '')) in ['429', '402', '403', '503']:
                return True
        except:
            pass

        return False

    def call_with_backoff(self, provider: str, func, *args, **kwargs):
        """Call a function with exponential backoff - attempts are per-operation, not global."""
        lock = self._get_lock(provider)

        # Reset provider status if it's been successful for a while
        with lock:
            if self._should_reset_provider_status(provider):
                self._provider_status[provider] = {
                    'last_error_time': 0,
                    'current_delay': 0
                }

        # Each operation gets its own attempt counter
        operation_attempts = 0

        for attempt in range(1, self._max_attempts + 1):
            operation_attempts = attempt

            # Check if we should apply a delay from previous provider errors
            with lock:
                provider_data = self._provider_status.get(provider, {})
                current_delay = provider_data.get('current_delay', 0)

            # Wait outside the lock if needed
            if current_delay > 0:
                print(
                    f"⏳ Waiting {current_delay:.1f}s before retry for {provider} (operation attempt {attempt})...")
                time.sleep(current_delay)

            try:
                result = func(*args, **kwargs)

                # Success - reset provider status
                with lock:
                    self._provider_status[provider] = {
                        'last_error_time': 0,
                        'current_delay': 0
                    }

                return result

            except Exception as e:
                error_msg = str(e).lower()

                # Check if this is a rate limit / quota error
                if self._is_rate_limit_error(error_msg, e):
                    # Calculate delay for this specific attempt
                    delay = self._calculate_delay(operation_attempts)

                    with lock:
                        self._provider_status[provider] = {
                            'last_error_time': time.time(),
                            'current_delay': delay
                        }

                    print(
                        f"❌ Rate limit error for {provider} (operation attempt {operation_attempts})")
                    print(f"   Next retry in {delay:.1f}s: {str(e)[:100]}...")

                    if attempt >= self._max_attempts:
                        print(
                            f"❌ Max attempts ({self._max_attempts}) reached for this operation")
                        raise Exception(
                            f"Max attempts ({self._max_attempts}) exceeded for {provider} operation")

                    # Continue to next attempt
                    continue
                else:
                    # Non-rate-limit error, don't retry
                    raise e

        # Should never reach here, but just in case
        raise Exception(
            f"Max attempts ({self._max_attempts}) exceeded for {provider} operation")

    def get_status(self, provider: str) -> Dict[str, Any]:
        """Get the current status of the rate limiter for a provider."""
        lock = self._get_lock(provider)

        with lock:
            provider_data = self._provider_status.get(provider, {})
            last_error = provider_data.get('last_error_time', 0)
            current_delay = provider_data.get('current_delay', 0)

            # Consider provider healthy if no recent errors
            is_healthy = last_error == 0 or (
                time.time() - last_error) > self._reset_after

            return {
                "provider": provider,
                # Simplified: 0 = healthy, 1 = backing off
                "attempt_count": 0 if is_healthy else 1,
                "next_delay_seconds": current_delay,
                "last_error_time": last_error if last_error > 0 else None,
                "status": "healthy" if is_healthy else "backing_off"
            }


# Global instance
_rate_limiter = SimpleRateLimiter()


def get_rate_limiter() -> SimpleRateLimiter:
    """Get the global rate limiter instance."""
    return _rate_limiter


def with_exponential_backoff(provider: str):
    """Decorator to add exponential backoff to a function."""
    def decorator(func):
        def wrapper(*args, **kwargs):
            return _rate_limiter.call_with_backoff(provider, func, *args, **kwargs)
        return wrapper
    return decorator


def get_quota_status(provider: str) -> Dict[str, Any]:
    """Get quota status for a provider."""
    status = _rate_limiter.get_status(provider)

    return {
        "provider": provider,
        "quota_exhausted": status["attempt_count"] > 0,
        "quota_wait_time": status["next_delay_seconds"],
        "attempt_count": status["attempt_count"],
        "status": status["status"]
    }
