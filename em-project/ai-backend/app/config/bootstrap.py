"""
`.env`를 앱의 다른 모듈이 ``os.environ`` / 설정을 읽기 **전에** 한 번 로드한다.

특히 ``app.agents.retriever``는 import 시점에 Neo4j 환경변수를 읽지 않더라도,
``app.agents.llms`` 등은 모듈 로드 시 Ollama 설정을 읽는다. ``main`` 및
``app.api.routes.chat``에서는 반드시 ``app.agents`` 트리를 import하기 **전에**
``import app.config.bootstrap`` 한 줄을 실행한다.
"""

from dotenv import load_dotenv

load_dotenv()
