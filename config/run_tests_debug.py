import sys
import os
import django
from django.conf import settings
from django.test.utils import get_runner

# Add config directory to path
sys.path.append(r'd:\SAT_Fergana\LMS_SATFergana\config')
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

TestRunner = get_runner(settings)
test_runner = TestRunner(verbosity=2, interactive=False)

try:
    failures = test_runner.run_tests(['apps.notifications', 'apps.classes'])
    if failures:
        print(f"Tests failed with {failures} failures/errors")
except Exception as e:
    import traceback
    print("An exception occurred during test execution:")
    traceback.print_exc()
    sys.exit(1)

sys.exit(bool(failures))
