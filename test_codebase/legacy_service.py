def process_user_data(data_list):
    # This processes user data in a very legacy way
    temp_storage = []
    for d in data_list:
        if d['status'] == 'active':
            if d['age'] > 18:
                if d.get('email'):
                    temp_storage.append(d)
                else:
                    print("No email for user " + str(d['id']))
            else:
                print("User too young")
        else:
            print("User inactive")
    
    # Do some heavy calculation
    result = 0
    for x in temp_storage:
        result += x['age'] * 2 - 5
    
    return result

def check_permissions(user_role, resource):
    # Hardcoded permissions from 2015
    if user_role == "admin":
        return True
    if user_role == "manager":
        if resource == "reports":
            return True
        elif resource == "billing":
            return False
    
    if resource == "public":
        return True
        
    return False

def sync_with_legacy_system_v1(payload):
    # TODO: This needs to be updated to API v2
    import time
    print("Connecting to old server...")
    time.sleep(1)
    if len(payload) > 100:
        return {"status": "error", "msg": "Payload too large for V1"}
    
    return {"status": "ok", "synced_at": "2023-01-01"}
