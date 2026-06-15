import paramiko
import sys

# SSH connection details
host = '49.234.30.96'
port = 22
username = 'ubuntu'
password = 'Sz13001300'

# Files to read
files = [
    '/opt/agency-agents-main/product/product-manager.md',
    '/opt/agency-agents-main/product/product-feedback-synthesizer.md',
    '/opt/agency-agents-main/product/product-sprint-prioritizer.md',
    '/opt/agency-agents-main/marketing/marketing-growth-hacker.md',
    '/opt/agency-agents-main/marketing/marketing-content-creator.md',
    '/opt/agency-agents-main/marketing/marketing-xiaohongshu-specialist.md',
    '/opt/agency-agents-main/marketing/marketing-douyin-strategist.md',
    '/opt/agency-agents-main/engineering/engineering-frontend-developer.md',
    '/opt/agency-agents-main/engineering/engineering-backend-architect.md',
    '/opt/agency-agents-main/engineering/engineering-devops-automator.md',
    '/opt/agency-agents-main/sales/sales-deal-strategist.md',
    '/opt/agency-agents-main/support/support-support-responder.md',
    '/opt/agency-agents-main/finance/finance-financial-analyst.md',
    '/opt/agency-agents-main/security/security-architect.md',
    '/opt/agency-agents-main/project-management/project-manager-senior.md',
]

try:
    # Create SSH client
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    # Connect to server with timeout
    client.connect(hostname=host, port=port, username=username, password=password, timeout=30)
    
    for file_path in files:
        print(f"\n{'='*80}")
        print(f"# FILE: {file_path}")
        print('='*80)
        
        # Read file content
        stdin, stdout, stderr = client.exec_command(f'cat {file_path}')
        content = stdout.read().decode('utf-8')
        print(content)
    
    client.close()
    
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
