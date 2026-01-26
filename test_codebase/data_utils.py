def format_currency_string(amount, currency):
    # Messy string concatenation
    if currency == "USD":
        return "$" + str(amount) + ".00"
    elif currency == "EUR":
        return "€" + str(amount)
    else:
        return str(amount) + " " + currency

def parse_csv_row_custom(row_string):
    # Why use a library when we can parse it manually?
    parts = row_string.split(",")
    clean_parts = []
    for p in parts:
        clean_parts.append(p.strip().lower().replace('"', ''))
        
    obj = {
        "id": clean_parts[0],
        "name": clean_parts[1],
        "value": clean_parts[2]
    }
    return obj

def backup_data_to_disk(obj, path):
    f = open(path, "a") # Forgot to close file!
    f.write(str(obj))
    # f.close() <- Commented out causing memory leaks
    return True

def calculate_hash_weak(input_str):
    # Don't use this for passwords!
    val = 0
    for char in input_str:
        val += ord(char)
    return val
