# NSQF Verification - Manual Integration Testing Guide

## Test Scenario 1: Full Approve Flow

### Steps:
1. **Login as Issuer**
   - Navigate to `/issuer/login`
   - Login with credentials

2. **Navigate to New Issuance**
   - Click "New Issuance" in sidebar
   - Or go to `/issuer/new-issuance`

3. **Upload Certificate**
   - Fill in:
     - Learner Email: `test.learner@example.com`
     - Course Name: `AWS Cloud Developer Certificate`
   - Upload a PDF certificate
   - Click "Analyze Credential"

4. **Wait for AI Analysis**
   - Modal should appear: "Verify Credential Before Issuance"
   - Should show:
     - Certificate Details (read-only, gray background)
     - AI Extracted Skills (blue tags)
     - Proposed NSQF Alignment (teal background card)
       - Job Role / QP
       - NSQF Level badge
       - AI Reasoning
       - Confidence bar

5. **Verify Read-Only State**
   - Skills should be displayed as non-interactive tags
   - Job Role should be plain text
   - NSQF Level should be badge (not dropdown)
   - Reasoning should be italic text (not textarea)
   - Three buttons visible:
     - "Reject Mapping" (left, red hover)
     - "Edit Details" (center, with edit icon)
     - "Approve & Verify" (right, teal)

6. **Enter Edit Mode**
   - Click "Edit Details"
   - UI should change:
     - "Editing Mode" indicator appears (animated pulse)
     - Job Role becomes dropdown
     - NSQF Level becomes dropdown
     - Skills show remove buttons (X icons)
     - Input field appears for adding skills
     - Reasoning becomes textarea
     - Buttons change to:
       - "Reject Mapping"
       - "Cancel Edit"
       - "Approve Changes" (green, with checkmark)

7. **Edit Skills**
   - Type "Docker" in skill input
   - See suggestions dropdown appear
   - Click suggestion or type custom skill
   - Click "Add"
   - Skill should appear as blue tag with X button
   - Click X on a skill to remove it
   - Verify skill is removed

8. **Edit Job Role**
   - Click dropdown
   - Select "Other (Custom)"
   - Custom input field should appear
   - Type "AWS Solutions Architect"
   - Verify it stays visible (bug fix verification)
   - OR select predefined role from list

9. **Edit NSQF Level**
   - Click level dropdown
   - Select different level (e.g., 6)
   - Verify it updates

10. **Edit Reasoning**
    - Click in textarea
    - Modify text: "Verified by issuer after manual review"
    - Verify text updates

11. **Approve Changes**
    - Click "Approve Changes"
    - Modal should close
    - Watch network tab:
      - POST to `/credentials/issue`
      - Payload should include:
        ```json
        {
          "ai_extracted_data": {
            "skills": [...edited skills],
            "nsqf_alignment": {
              "job_role": "AWS Solutions Architect",
              "nsqf_level": 6,
              "reasoning": "Verified by issuer...",
              ...
            }
          },
          "verification_status": {
            "aligned": true,
            ...
          }
        }
        ```
    - Success message: "Credential issued successfully!"
    - Form should reset

12. **Verify in Database**
    - Check credential in database
    - `metadata.ai_extracted.nsqf_alignment` should have:
      - Updated job_role
      - Updated nsqf_level
      - Updated skills array
      - Updated reasoning
      - `verified_by_issuer: true`
    - `verification_status.aligned: true`

---

## Test Scenario 2: Reject Flow

### Steps:
1-5. Same as Scenario 1 (upload and analyze)

6. **Reject Without Editing**
   - Click "Reject Mapping" directly
   - Modal should close
   - Credential should be issued with:
     - `verification_status.aligned: false`
     - `verification_status.reasoning: "Issuer rejected AI mapping"`
     - Original AI data preserved

---

## Test Scenario 3: Edit Then Cancel

### Steps:
1-6. Same as Scenario 1 (enter edit mode)

7. **Make Edits**
   - Change job role
   - Add/remove skills
   - Change NSQF level

8. **Cancel Edit**
   - Click "Cancel Edit"
   - UI should revert to read-only mode
   - All edits should be discarded
   - Original AI data still displayed
   - Can still approve or reject with original data

---

## Test Scenario 4: Validation Errors

### Test Case 4A: Invalid NSQF Level
1. Use browser DevTools → Console
2. Try to submit with invalid level:
   ```javascript
   fetch('/api/credentials/credential-id/nsqf-verification', {
     method: 'PUT',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       status: 'approved',
       job_role: 'Developer',
       nsqf_level: 11  // Invalid
     })
   })
   ```
3. Should return 400 error: "NSQF level must be between 1 and 10"

### Test Case 4B: Approve Without Required Fields
1. From DevTools:
   ```javascript
   fetch('/api/credentials/credential-id/nsqf-verification', {
     method: 'PUT',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       status: 'approved'
       // Missing job_role and nsqf_level
     })
   })
   ```
2. Should return 400 error with validation message

### Test Case 4C: Empty Skill Name
1. Try to submit:
   ```javascript
   {
     status: 'approved',
     job_role: 'Dev',
     nsqf_level: 5,
     skills: [{ name: '', confidence: 0.9 }]
   }
   ```
2. Should return 400 error: "Skill name cannot be empty"

---

## Test Scenario 5: UX Fixes Verification

### Issue: Custom Job Role Input Disappearing
**Test:**
1. Enter edit mode
2. Select "Other (Custom)"
3. Custom input should appear
4. Type text and delete all characters
5. Input should remain visible and focused
6. Type new custom role
7. ✅ Input should stay visible throughout

### Issue: Skills UX
**Test:**
1. Enter edit mode
2. Start typing in skill input
3. Suggestions dropdown should appear
4. Click suggestion → adds skill
5. Type partial match → filters suggestions
6. Type non-existent skill → can still add
7. Click X on skill → removes immediately
8. ✅ No separate "custom skill" input needed

---

## Network Request Verification

### Expected Request (Approve):
```http
POST /api/credentials/issue HTTP/1.1
Content-Type: multipart/form-data

{
  "learner_email": "test@example.com",
  "certificate_title": "AWS Cloud Developer",
  "issued_at": "2024-01-15T10:30:00Z",
  "file": <binary>,
  "ai_extracted_data": "{\"skills\":[{\"name\":\"AWS\",\"confidence\":1.0}],\"nsqf_alignment\":{\"job_role\":\"Cloud Architect\",\"qp_code\":\"QP2101\",\"nsqf_level\":6,\"reasoning\":\"Verified\",\"confidence\":0.9}}",
  "verification_status": "{\"aligned\":true,\"qp_code\":\"QP2101\",\"nsqf_level\":6,\"confidence\":0.9,\"reasoning\":\"Verified\"}"
}
```

### Expected Response:
```json
{
  "success": true,
  "message": "Credential issued successfully",
  "data": {
    "credential_id": "uuid-here",
    "learner_id": 42,
    "learner_email": "test@example.com",
    "certificate_title": "AWS Cloud Developer",
    "ipfs_cid": "QmXxx...",
    "tx_hash": "0xTxHash...",
    "data_hash": "hash...",
    "pdf_url": "https://ipfs.filebase.io/ipfs/QmXxx...",
    "status": "issued",
    "issued_at": "2024-01-15T10:30:00Z"
  }
}
```

---

## Browser Testing Checklist

### Visual Checks:
- [ ] Modal centers properly
- [ ] Teal background on NSQF card (read-only)
- [ ] Blue/white background in edit mode
- [ ] Skills show as blue tags
- [ ] Level badge displays correctly
- [ ] Confidence bar animates correctly
- [ ] Buttons have proper colors and icons
- [ ] Edit icon visible on "Edit Details" button
- [ ] Checkmark icon on "Approve Changes"
- [ ] Hover states work on all buttons

### Functional Checks:
- [ ] Modal backdrop blocks clicks
- [ ] X button closes modal
- [ ] "Edit Details" enables editing
- [ ] "Cancel Edit" reverts changes
- [ ] Skills can be added
- [ ] Skills can be removed
- [ ] Skill suggestions work
- [ ] Custom job role input stays visible
- [ ] Dropdowns work correctly
- [ ] "Approve & Verify" issues credential
- [ ] "Reject Mapping" issues with rejection
- [ ] Success message displays

### Data Integrity:
- [ ] Edited skills saved correctly
- [ ] Edited job_role saved correctly
- [ ] Edited nsqf_level saved correctly
- [ ] Edited reasoning saved correctly
- [ ] Original AI confidence preserved
- [ ] Verification timestamp added
- [ ] verified_by_issuer flag set

---

## Automated Test Command

```bash
# Run backend tests
cd server/node-app
npm test -- nsqf-verification.test.ts

# Expected: 15 tests passing
```

---

## Known Issues to Test

### ✅ Fixed Issues:
1. Custom job role input disappearing → Now stable with `isCustomRole` state
2. Skills UX improvement → Unified input with suggestions
3. Read-only mode not enforced → Now defaults to read-only, requires "Edit Details" click

### 🔍 Watch For:
1. File upload modal triggering (should work)
2. Network errors gracefully handled
3. Loading states display correctly
4. Form resets after successful issuance

---

## Success Criteria

✅ All visual elements match the provided screenshot  
✅ Edit mode properly isolated from read-only mode  
✅ Skills management intuitive and functional  
✅ Custom job role input remains stable  
✅ Backend validation catches all invalid inputs  
✅ Data flows correctly from modal → backend → database  
✅ All 15 automated tests pass  
✅ Manual testing scenarios complete without errors
