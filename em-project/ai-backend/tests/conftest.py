"""pytest 공통: 항상 ``.env``가 로드된 뒤 앱 패키지를 불러오도록 한다."""

import app.config.bootstrap  # noqa: F401
