# Friends Page - Debugging Guide

## 🔍 Enhanced Debugging is Now Active!

I've added detailed console logging to help diagnose any issues.

---

## 🧪 How to Test

### Step 1: Open the Site

Visit: **https://quasar-spoileralert-62upelplp-mikeheldars-projects.vercel.app**

### Step 2: Open Browser Console

- **Chrome/Edge**: Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
- **Firefox**: Press `F12` or `Cmd+Option+K` (Mac)
- Click on the **"Console"** tab

### Step 3: Log In

- Click "Sign In" in header
- Choose Google or Facebook
- Complete login

### Step 4: Go to Friends Page

- Open menu (☰)
- Click "Friends"
- Watch the console!

### Step 5: Type "John"

Type slowly: **J** → **Jo** → **Joh** → **John**

---

## 📋 What You Should See in Console

### When Page Loads:

```
Loading Google contacts...
✅ Google contacts loaded: 8
💡 Contacts ready - type to search or enter an email to invite
```

### When You Type "J":

```
🔍 === filterContacts called ===
🔍 Search query: j
📇 Available contacts: 8
📇 All contacts: Array(8)
🔍 Trimmed query: j
Checking Jane Smith: name=true, email=false
Checking John Doe: name=true, email=false
Checking Sarah Johnson: name=true, email=false
Checking Mike Williams: name=false, email=false
Checking Emily Davis: name=false, email=false
Checking Alex Brown: name=false, email=false
Checking Lisa Anderson: name=false, email=false
Checking James Wilson: name=true, email=false
🎯 Filtered results before email check: 4
✅ Final displayed contacts: 4
📋 Contacts shown: Jane Smith, John Doe, Sarah Johnson, James Wilson
```

### When You Continue to "John":

```
🔍 === filterContacts called ===
🔍 Search query: john
📇 Available contacts: 8
🔍 Trimmed query: john
Checking Jane Smith: name=false, email=false
Checking John Doe: name=true, email=false
Checking Sarah Johnson: name=true, email=false
...
✅ Final displayed contacts: 2
📋 Contacts shown: John Doe, Sarah Johnson
```

### When You Type a Valid Email:

```
🔍 === filterContacts called ===
🔍 Search query: friend@example.com
📇 Available contacts: 8
🔍 Trimmed query: friend@example.com
(checks all contacts - no matches)
🎯 Filtered results before email check: 0
✉️ Added email as invitable contact: friend@example.com
✅ Final displayed contacts: 1
📋 Contacts shown: friend
```

---

## 🐛 Troubleshooting

### Problem: "No contacts loaded" or "Available contacts: 0"

**Check:**

1. Are you logged in with Google or Facebook?
2. Look for this log: `✅ Google contacts loaded: 8`
3. If not there, contacts didn't load

**Solution:**

- Refresh the page
- Check `sessionStorage.getItem('loginMethod')` in console
- Should return `'google'` or `'facebook'`

### Problem: "filterContacts not being called"

**Check:**

1. Do you see `🔍 === filterContacts called ===` when typing?
2. If not, the event isn't firing

**Try:**

```javascript
// In browser console, manually trigger:
document.querySelector('input').dispatchEvent(new Event('input'));
```

### Problem: "Contacts found but not displaying"

**Check:**

1. See if `✅ Final displayed contacts: X` shows > 0
2. Check the template is rendering the list
3. Look for `v-if="displayedContacts.length > 0"`

**Debug in Console:**

```javascript
// Check Vue component data:
$vm0.displayedContacts; // Should show the array
$vm0.allContacts; // Should show 8 items
```

### Problem: "Typing but nothing happens"

**Manually Test:**

```javascript
// In console:
$vm0.searchQuery = 'john';
$vm0.filterContacts();
console.log($vm0.displayedContacts);
```

---

## 🎯 Expected Behavior

### Clean Start:

```
1. Page loads
2. Contacts load in background (takes ~1 second)
3. List is EMPTY (no contacts shown)
4. Search box is active and ready
```

### As You Type:

```
Input: "j"
→ Shows: Jane Smith, John Doe, Sarah Johnson, James Wilson

Input: "jo"
→ Shows: John Doe, Sarah Johnson

Input: "joh"
→ Shows: John Doe, Sarah Johnson

Input: "john"
→ Shows: John Doe, Sarah Johnson
```

### Valid Email:

```
Input: "newperson@gmail.com"
→ Shows: newperson
         newperson@gmail.com
         "Not in contacts - will send invitation"
         [Send Request]
```

### After Sending Invite:

```
1. Click "Send Request" on John Doe
2. Success dialog appears
3. Scroll down to see "Pending Invitations" section
4. John Doe appears there with [Cancel] button
5. Search "john" again
6. John now shows [🟠 Pending] badge instead of [Send Request]
```

---

## 📊 Data to Check

### In Browser Console:

**Check if contacts loaded:**

```javascript
sessionStorage.getItem('loginMethod'); // Should be 'google' or 'facebook'
```

**Check component data (select the Friends page element first):**

```javascript
$vm0.allContacts.length; // Should be 8
$vm0.allContacts; // Should show array of 8 contacts
$vm0.displayedContacts.length; // Should match filtered results
$vm0.searchQuery; // Should match what you typed
```

**Manually trigger search:**

```javascript
$vm0.searchQuery = 'john';
$vm0.filterContacts();
console.log($vm0.displayedContacts); // Should show John Doe + Sarah Johnson
```

---

## ✅ Success Indicators

When working correctly, you should see:

1. **On page load:**

   - ✅ `Google contacts loaded: 8`
   - ✅ Empty list (no contacts visible)

2. **When typing "john":**

   - ✅ `filterContacts called` log appears
   - ✅ Console shows "Checking" each contact
   - ✅ Shows "Filtered results: 2"
   - ✅ John Doe and Sarah Johnson appear in UI

3. **When typing email:**

   - ✅ Console shows "Added email as invitable contact"
   - ✅ Email appears in list with special label
   - ✅ [Send Request] button visible

4. **After sending:**
   - ✅ Success dialog
   - ✅ Contact in "Pending Invitations"
   - ✅ Badge changes to [Pending]

---

## 🚀 Quick Diagnostic

Copy this into browser console:

```javascript
console.log('=== DIAGNOSTIC ===');
console.log('Login Method:', sessionStorage.getItem('loginMethod'));
console.log('All Contacts:', $vm0.allContacts);
console.log('Displayed Contacts:', $vm0.displayedContacts);
console.log('Search Query:', $vm0.searchQuery);
console.log('Is Loading:', $vm0.isLoadingContacts);
```

This will show you exactly what state the component is in!

---

## 💡 Common Issues & Fixes

### Issue: "I see 8 contacts loaded but typing doesn't work"

**Fix:** The filterContacts function might not be firing. Check console for `🔍 === filterContacts called ===`

### Issue: "Console shows results but UI is empty"

**Fix:** Check if `displayedContacts.length > 0` in console. If yes, it's a rendering issue.

### Issue: "No contacts loading at all"

**Fix:** You might not be logged in with social method. Check `sessionStorage.getItem('loginMethod')`

---

**Try it now with console open and watch the detailed logs!** 🔍

