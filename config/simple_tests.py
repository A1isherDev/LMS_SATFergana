import os
import sys
import django
from django.conf import settings

# Add config directory to path
sys.path.append(r'd:\SAT_Fergana\LMS_SATFergana\config')
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.conf import settings
if 'testserver' not in settings.ALLOWED_HOSTS:
    settings.ALLOWED_HOSTS.append('testserver')

import unittest
from apps.notifications.tests import NotificationTests
from apps.classes.tests import AnnouncementTests

suite = unittest.TestLoader().loadTestsFromTestCase(NotificationTests)
suite.addTests(unittest.TestLoader().loadTestsFromTestCase(AnnouncementTests))

runner = unittest.TextTestRunner(verbosity=2)
try:
    result = runner.run(suite)
    if not result.wasSuccessful():
        print("\n=== TEST FAILURES/ERRORS ===")
        for failure in result.failures:
            print(f"\nFAILURE: {failure[0]}")
            print(failure[1])
        for error in result.errors:
            print(f"\nERROR: {error[0]}")
            print(error[1])
        sys.exit(1)
except Exception as e:
    import traceback
    print("\n=== FATAL EXCEPTION ===")
    traceback.print_exc()
    sys.exit(1)
