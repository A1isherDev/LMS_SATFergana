import re

with open('error_page.html', 'rb') as f:
    content = f.read().decode('utf-16le')

# Look for Exception Value
match = re.search(r'Exception Value:</th>\s*<td><pre>(.*?)</pre></td>', content, re.DOTALL)
if match:
    print(f"Exception Value: {match.group(1)}")

# Look for Exception Type
match = re.search(r'Exception Type:</th>\s*<td>(.*?)</td>', content, re.DOTALL)
if match:
    print(f"Exception Type: {match.group(1)}")

# Look for traceback line
match = re.search(r'<tr class="error">.*?<pre>(.*?)</pre>', content, re.DOTALL)
if match:
    print(f"Traceback Line: {match.group(1)}")
