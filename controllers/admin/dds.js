

// ============================================
// API ENDPOINT DOCUMENTATION
// ============================================

/*

==============================================
JOURNEY MANAGEMENT API ENDPOINTS
==============================================

BASE URL: /api/journeys
All endpoints require Bearer token authentication

==============================================
1. START JOURNEY
==============================================
POST /api/journeys/start

Body:
{
  "deliveryId": "507f1f77bcf86cd799439011",
  "latitude": 23.0225,
  "longitude": 72.5714,
  "address": "Warehouse Location"
}

Response:
{
  "success": true,
  "message": "Journey started successfully! Package picked up.",
  "data": {
    "journeyId": "507f...",
    "deliveryStatus": "picked_up",
    "trackingNumber": "TRK123456",
    "pickupTime": "2024-01-15T10:30:00.000Z"
  }
}

==============================================
2. ADD CHECKPOINT
==============================================
POST /api/journeys/:journeyId/checkpoints

Body:
{
  "latitude": 23.0330,
  "longitude": 72.5850,
  "address": "Traffic Signal Checkpoint",
  "activity": "checkpoint",
  "remarks": "Heavy traffic"
}

Response:
{
  "success": true,
  "message": "Checkpoint added successfully",
  "data": {
    "checkpointIndex": 0,
    "checkpoint": {...},
    "totalCheckpoints": 1
  }
}

==============================================
3. ADD JOURNEY IMAGE
==============================================
POST /api/journeys/:journeyId/images

Form Data:
- image: File (required)
- caption: "Package at checkpoint"
- latitude: 23.0330
- longitude: 72.5850
- imageType: "checkpoint" | "pickup" | "delivery" | "damage" | "general"

Response:
{
  "success": true,
  "message": "Image added to journey successfully!",
  "data": {
    "image": {...},
    "totalImages": 1
  }
}

==============================================
4. ⭐ INITIATE CALL
==============================================
POST /api/journeys/:journeyId/call

Body:
{
  "phoneNumber": "+919876543210",
  "contactName": "Customer Name"
}

Response:
{
  "success": true,
  "message": "Call initiated successfully",
  "data": {
    "callId": "507f...",
    "phoneNumber": "+919876543210",
    "callUrl": "tel:+919876543210",
    "contactName": "Customer Name",
    "totalCalls": 1
  }
}

==============================================
5. ⭐ END CALL
==============================================
PUT /api/journeys/:journeyId/call/:callId/end

Body:
{
  "duration": 120,
  "status": "completed"
}

Response:
{
  "success": true,
  "message": "Call ended and logged successfully",
  "data": {
    "callId": "507f...",
    "duration": "120 seconds",
    "status": "completed"
  }
}

==============================================
6. ⭐ INITIATE WHATSAPP
==============================================
POST /api/journeys/:journeyId/whatsapp

Body:
{
  "phoneNumber": "+919876543210",
  "contactName": "Customer Name",
  "message": "I'm on my way with your delivery"
}

Response:
{
  "success": true,
  "message": "WhatsApp initiated successfully",
  "data": {
    "whatsappId": "507f...",
    "phoneNumber": "919876543210",
    "whatsappUrl": "https://wa.me/919876543210?text=...",
    "contactName": "Customer Name",
    "totalWhatsAppMessages": 1
  }
}

==============================================
7. ⭐ GET NAVIGATION
==============================================
GET /api/journeys/:journeyId/navigate?currentLatitude=23.0225&currentLongitude=72.5714&navigationType=google_maps

Response:
{
  "success": true,
  "message": "Navigation details retrieved",
  "data": {
    "destination": {
      "address": "Customer Address",
      "coordinates": {
        "latitude": 23.0450,
        "longitude": 72.6000
      },
      "recipientName": "John Doe",
      "recipientPhone": "+919876543210"
    },
    "navigation": {
      "googleMaps": "https://www.google.com/maps/dir/?api=1&destination=...",
      "appleMaps": "http://maps.apple.com/?daddr=...",
      "waze": "https://waze.com/ul?ll=..."
    },
    "estimatedDistance": "5.2 km",
    "estimatedDuration": "8 mins"
  }
}

==============================================
8. ⭐ UPLOAD RECORDING/SCREENSHOT
==============================================
POST /api/journeys/:journeyId/recordings

Form Data:
- recording: File (required)
- type: "screenshot" | "video" | "audio" | "document"
- caption: "Screenshot at checkpoint"
- waypointIndex: 0
- duration: 30 (for video/audio)

Response:
{
  "success": true,
  "message": "Recording uploaded successfully",
  "data": {
    "recording": {
      "recordingId": "REC_1234567890",
      "type": "screenshot",
      "url": "/uploads/recordings/...",
      "timestamp": "2024-01-15T10:35:00.000Z"
    },
    "totalRecordings": 1
  }
}

==============================================
9. ⭐ GET COMMUNICATION HISTORY
==============================================
GET /api/journeys/:journeyId/communications?type=call

Query Params:
- type: "call" | "whatsapp" | "sms" (optional)

Response:
{
  "success": true,
  "message": "Communication history retrieved",
  "data": {
    "delivery": {
      "trackingNumber": "TRK123456",
      "recipientName": "John Doe",
      "recipientPhone": "+919876543210"
    },
    "summary": {
      "totalCalls": 3,
      "totalWhatsApp": 2,
      "totalSMS": 0,
      "totalDuration": 360
    },
    "communicationLog": [
      {
        "id": "507f...",
        "type": "call",
        "contactName": "Customer",
        "phoneNumber": "+919876543210",
        "timestamp": "2024-01-15T10:30:00.000Z",
        "duration": "120 seconds",
        "status": "completed"
      }
    ]
  }
}

==============================================
10. UPLOAD SIGNATURE
==============================================
POST /api/journeys/:deliveryId/signature

Form Data:
- signature: File (required)
- customerName: "John Doe"
- customerPhone: "+919876543210"
- latitude: 23.0450
- longitude: 72.6000

Response:
{
  "success": true,
  "message": "Customer signature uploaded successfully!",
  "data": {
    "signatureUrl": "/uploads/signatures/...",
    "deliveryId": "507f...",
    "trackingNumber": "TRK123456",
    "signedBy": "John Doe"
  }
}

==============================================
11. END JOURNEY
==============================================
POST /api/journeys/:journeyId/end

Body:
{
  "latitude": 23.0450,
  "longitude": 72.6000,
  "address": "Customer Address",
  "finalRemarks": "Delivered successfully"
}

Response:
{
  "success": true,
  "message": "Journey ended successfully! You are now free for new deliveries",
  "data": {
    "journey": {
      "id": "507f...",
      "status": "completed",
      "totalDistance": "12.5 km",
      "totalDuration": "45 mins",
      "averageSpeed": "16.67 km/h",
      "totalCheckpoints": 3,
      "totalImages": 5,
      "totalCalls": 2,
      "totalWhatsApp": 1
    },
    "driverStatus": "Available",
    "deliveryStatus": "delivered"
  }
}

==============================================
12. CANCEL JOURNEY
==============================================
POST /api/journeys/:journeyId/cancel

Body:
{
  "reason": "Customer unavailable",
  "latitude": 23.0330,
  "longitude": 72.5850
}

Response:
{
  "success": true,
  "message": "Journey cancelled successfully",
  "data": {
    "journeyId": "507f...",
    "status": "cancelled",
    "reason": "Cancelled: Customer unavailable",
    "driverStatus": "Available"
  }
}

==============================================
13. GET ACTIVE JOURNEY
==============================================
GET /api/journeys/active

Response:
{
  "success": true,
  "message": "Active journey retrieved successfully",
  "data": {
    "journeyId": "507f...",
    "status": "in_progress",
    "startTime": "2024-01-15T10:00:00.000Z",
    "duration": 45,
    "delivery": {...},
    "startLocation": {...},
    "checkpoints": [...],
    "images": [...],
    "communication": {
      "totalCalls": 2,
      "totalWhatsApp": 1,
      "lastCall": {...},
      "lastWhatsApp": {...}
    },
    "recordings": [...],
    "totalCheckpoints": 3,
    "totalImages": 5,
    "totalRecordings": 2
  }
}

==============================================
14. GET JOURNEY DETAILS
==============================================
GET /api/journeys/:journeyId

Response:
{
  "success": true,
  "message": "Journey details retrieved successfully",
  "data": {
    "journey": {...},
    "delivery": {...},
    "driver": {...},
    "checkpoints": [...],
    "images": [...],
    "communications": [...],
    "recordings": [...],
    "navigation": [...]
  }
}

==============================================
15. GET JOURNEY HISTORY
==============================================
GET /api/journeys?page=1&limit=10&status=completed

Query Params:
- page: 1 (default)
- limit: 10 (default)
- status: "started" | "in_progress" | "completed" | "cancelled" (optional)

Response:
{
  "success": true,
  "message": "Journey history retrieved successfully",
  "data": {
    "total": 50,
    "page": 1,
    "pages": 5,
    "journeys": [
      {
        "journeyId": "507f...",
        "trackingNumber": "TRK123456",
        "status": "completed",
        "deliveryStatus": "delivered",
        "startTime": "2024-01-15T10:00:00.000Z",
        "endTime": "2024-01-15T11:00:00.000Z",
        "duration": "60 mins",
        "distance": "15.5 km",
        "averageSpeed": "15.5 km/h",
        "pickup": "Warehouse",
        "delivery": "Customer Address",
        "totalCheckpoints": 4,
        "totalImages": 6,
        "totalCalls": 3,
        "totalWhatsApp": 2,
        "totalRecordings": 3
      }
    ]
  }
}

==============================================
SCREEN-WISE MAPPING
==============================================

Screen 1 (Start Journey):
- POST /api/journeys/start

Screen 2 (Add Checkpoints):
- POST /api/journeys/:journeyId/checkpoints
- GET /api/journeys/active (to show current checkpoints)

Screen 3 (Add Images):
- POST /api/journeys/:journeyId/images

Screen 4 (Customer Signature):
- POST /api/journeys/:deliveryId/signature

Screen 5 (End Journey):
- POST /api/journeys/:journeyId/end

⭐ NEW FEATURES (Call, WhatsApp, Navigation):
- POST /api/journeys/:journeyId/call
- PUT /api/journeys/:journeyId/call/:callId/end
- POST /api/journeys/:journeyId/whatsapp
- GET /api/journeys/:journeyId/navigate
- GET /api/journeys/:journeyId/communications

⭐ Recording/Screenshot:
- POST /api/journeys/:journeyId/recordings

// ============================================
// INTEGRATION GUIDE & SUMMARY
// ============================================

/*

==============================================
✅ WHAT'S BEEN ADDED TO YOUR EXISTING CODE
==============================================

1. ⭐ COMMUNICATION FEATURES
   - Call initiation & tracking (with duration logging)
   - WhatsApp integration
   - SMS support
   - Communication history logging
   - Contact management

2. ⭐ NAVIGATION FEATURES
   - Google Maps integration
   - Apple Maps integration
   - Waze integration
   - Distance & duration estimation
   - Navigation history tracking

3. ⭐ RECORDING/SCREENSHOT FEATURES
   - Screenshot upload
   - Video recording upload
   - Audio recording upload
   - Document upload
   - Link recordings to specific checkpoints

4. ⭐ ENHANCED JOURNEY FEATURES
   - Cancel journey functionality
   - Delivery proof management
   - Enhanced communication logging
   - Navigation history

==============================================
📝 MODEL CHANGES (Journey.js)
==============================================

NEW FIELDS ADDED:

1. communicationLog: [{
     type: 'call' | 'whatsapp' | 'sms',
     contactName: String,
     phoneNumber: String,
     timestamp: Date,
     duration: Number,
     status: 'initiated' | 'connected' | 'completed' | 'failed',
     remarks: String
   }]

2. recordings: [{
     recordingId: String,
     type: 'screenshot' | 'video' | 'audio' | 'document',
     url: String,
     timestamp: Date,
     waypointIndex: Number,
     fileSize: Number,
     duration: Number
   }]

3. navigationHistory: [{
     destination: {
       address: String,
       coordinates: { latitude, longitude }
     },
     startedAt: Date,
     completedAt: Date,
     navigationApp: String,
     estimatedDistance: Number,
     estimatedDuration: Number
   }]

4. deliveryProof: {
     signature: String,
     signedBy: String,
     signedAt: Date,
     photos: [String],
     recipientIdPhoto: String,
     notes: String
   }

==============================================
🆕 NEW CONTROLLER METHODS
==============================================

1. initiateCall(req, res)
   - Logs call initiation
   - Returns call URL for dialing
   - Tracks communication history

2. endCall(req, res)
   - Updates call duration
   - Marks call as completed
   - Updates communication log

3. initiateWhatsApp(req, res)
   - Generates WhatsApp deep link
   - Logs WhatsApp communication
   - Supports custom messages

4. getNavigation(req, res)
   - Returns navigation URLs for all apps
   - Calculates distance & duration
   - Logs navigation history

5. uploadRecording(req, res)
   - Handles file upload (screenshot/video/audio)
   - Links to specific checkpoint
   - Stores metadata

6. getCommunicationHistory(req, res)
   - Returns all communications
   - Filter by type (call/whatsapp/sms)
   - Shows summary statistics

7. cancelJourney(req, res)
   - Cancels active journey
   - Updates delivery status
   - Frees up driver

==============================================
🔌 NEW API ROUTES
==============================================

Communication:
✅ POST   /api/journeys/:journeyId/call
✅ PUT    /api/journeys/:journeyId/call/:callId/end
✅ POST   /api/journeys/:journeyId/whatsapp
✅ GET    /api/journeys/:journeyId/communications

Navigation:
✅ GET    /api/journeys/:journeyId/navigate

Recording:
✅ POST   /api/journeys/:journeyId/recordings

Journey Management:
✅ POST   /api/journeys/:journeyId/cancel

==============================================
📱 MOBILE APP INTEGRATION
==============================================

CALL FUNCTIONALITY:
```javascript
// 1. Initiate Call
const response = await fetch(`${API_URL}/journeys/${journeyId}/call`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    phoneNumber: '+919876543210',
    contactName: 'Customer Name'
  })
});

const { data } = await response.json();
const { callUrl, callId } = data;

// 2. Open dialer
if (Platform.OS === 'ios') {
  Linking.openURL(callUrl);
} else {
  Linking.openURL(callUrl);
}

// 3. After call ends, log duration
await fetch(`${API_URL}/journeys/${journeyId}/call/${callId}/end`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    duration: 120, // seconds
    status: 'completed'
  })
});
```

WHATSAPP FUNCTIONALITY:
```javascript
// 1. Initiate WhatsApp
const response = await fetch(`${API_URL}/journeys/${journeyId}/whatsapp`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    phoneNumber: '+919876543210',
    contactName: 'Customer Name',
    message: "I'm on my way with your delivery!"
  })
});

const { data } = await response.json();
const { whatsappUrl } = data;

// 2. Open WhatsApp
Linking.openURL(whatsappUrl);
```

NAVIGATION FUNCTIONALITY:
```javascript
// 1. Get Navigation
const { latitude, longitude } = await getCurrentLocation();

const response = await fetch(
  `${API_URL}/journeys/${journeyId}/navigate?` +
  `currentLatitude=${latitude}&currentLongitude=${longitude}&` +
  `navigationType=google_maps`,
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);

const { data } = await response.json();

// 2. Open Navigation App
const { navigation } = data;
Linking.openURL(navigation.googleMaps); // or appleMaps or waze
```

SCREENSHOT UPLOAD:
```javascript
// 1. Capture Screenshot
import { captureScreen } from 'react-native-view-shot';

const uri = await captureScreen({
  format: 'jpg',
  quality: 0.8
});

// 2. Upload Screenshot
const formData = new FormData();
formData.append('recording', {
  uri: uri,
  type: 'image/jpeg',
  name: `screenshot_${Date.now()}.jpg`
});
formData.append('type', 'screenshot');
formData.append('waypointIndex', currentCheckpointIndex);

await fetch(`${API_URL}/journeys/${journeyId}/recordings`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data'
  },
  body: formData
});
```

==============================================
🎨 UI COMPONENT EXAMPLES
==============================================

CALL & WHATSAPP BUTTONS:
```jsx
import { TouchableOpacity, Linking } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Call Button
<TouchableOpacity 
  style={styles.callButton}
  onPress={handleCallPress}
>
  <Icon name="phone" size={24} color="#fff" />
  <Text style={styles.buttonText}>Call Customer</Text>
</TouchableOpacity>

// WhatsApp Button
<TouchableOpacity 
  style={styles.whatsappButton}
  onPress={handleWhatsAppPress}
>
  <Icon name="whatsapp" size={24} color="#fff" />
  <Text style={styles.buttonText}>WhatsApp</Text>
</TouchableOpacity>

const styles = StyleSheet.create({
  callButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginRight: 10
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8
  },
  buttonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: 'bold'
  }
});
```

NAVIGATION BUTTON:
```jsx
<TouchableOpacity 
  style={styles.navigationButton}
  onPress={handleNavigationPress}
>
  <Icon name="navigation" size={24} color="#fff" />
  <Text style={styles.buttonText}>Navigate</Text>
</TouchableOpacity>

// Show Navigation Options
const showNavigationOptions = () => {
  Alert.alert(
    'Choose Navigation App',
    'Select your preferred navigation app',
    [
      { text: 'Google Maps', onPress: () => openNavigation('googleMaps') },
      { text: 'Apple Maps', onPress: () => openNavigation('appleMaps') },
      { text: 'Waze', onPress: () => openNavigation('waze') },
      { text: 'Cancel', style: 'cancel' }
    ]
  );
};
```

COMMUNICATION HISTORY:
```jsx
<FlatList
  data={communications}
  renderItem={({ item }) => (
    <View style={styles.commItem}>
      <Icon 
        name={item.type === 'call' ? 'phone' : 'whatsapp'} 
        size={20} 
        color={item.type === 'call' ? '#4CAF50' : '#25D366'}
      />
      <View style={styles.commDetails}>
        <Text style={styles.commName}>{item.contactName}</Text>
        <Text style={styles.commTime}>
          {formatTime(item.timestamp)}
        </Text>
      </View>
      {item.duration && (
        <Text style={styles.commDuration}>
          {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
        </Text>
      )}
    </View>
  )}
  keyExtractor={item => item.id}
/>
```

==============================================
🔒 SECURITY CONSIDERATIONS
==============================================

1. ✅ All endpoints require authentication
2. ✅ Driver can only access their own journeys
3. ✅ File uploads are validated (size, type)
4. ✅ Phone numbers are sanitized
5. ✅ Communication logs are immutable
6. ✅ Recordings are linked to specific journeys

==============================================
📊 ANALYTICS & TRACKING
==============================================

You can now track:
- Total calls made per journey
- Total WhatsApp messages sent
- Call durations
- Navigation app preferences
- Screenshot frequency
- Communication patterns

Example Query:
```javascript
// Get journey with all communication stats
const journey = await Journey.findById(journeyId);

const stats = {
  totalCalls: journey.communicationLog.filter(c => c.type === 'call').length,
  totalWhatsApp: journey.communicationLog.filter(c => c.type === 'whatsapp').length,
  averageCallDuration: journey.communicationLog
    .filter(c => c.type === 'call' && c.duration)
    .reduce((sum, c) => sum + c.duration, 0) / 
    journey.communicationLog.filter(c => c.type === 'call' && c.duration).length,
  totalScreenshots: journey.recordings.filter(r => r.type === 'screenshot').length
};
```

==============================================
✅ TESTING CHECKLIST
==============================================

□ Test call initiation and logging
□ Test call duration tracking
□ Test WhatsApp deep linking
□ Test navigation URL generation
□ Test screenshot upload
□ Test video recording upload
□ Test communication history retrieval
□ Test journey cancellation
□ Test authorization (driver can't access others' journeys)
□ Test file upload validation
□ Test phone number formatting
□ Test concurrent calls handling

==============================================
🚀 DEPLOYMENT NOTES
==============================================

1. Update .env file:
   ```
   MAX_FILE_SIZE=10485760 # 10MB
   ALLOWED_FILE_TYPES=image/jpeg,image/png,video/mp4,audio/mpeg
   ```

2. Create upload directories:
   ```bash
   mkdir -p uploads/journey
   mkdir -p uploads/signatures
   mkdir -p uploads/recordings
   ```

3. Configure file upload middleware:
   ```javascript
   const multer = require('multer');
   const storage = multer.diskStorage({
     destination: (req, file, cb) => {
       let uploadPath = 'uploads/';
       if (req.path.includes('signature')) uploadPath += 'signatures/';
       else if (req.path.includes('recordings')) uploadPath += 'recordings/';
       else uploadPath += 'journey/';
       cb(null, uploadPath);
     },
     filename: (req, file, cb) => {
       cb(null, `${Date.now()}_${file.originalname}`);
     }
   });
   ```

4. Add routes to server.js:
   ```javascript
   const journeyRoutes = require('./routes/journeyRoutes');
   app.use('/api/journeys', journeyRoutes);
   ```

==============================================
📞 SUPPORT & TROUBLESHOOTING
==============================================

Common Issues:

1. Call not initiating:
   - Check if phone number format is correct
   - Ensure device has dialer app
   - Verify permissions in manifest

2. WhatsApp not opening:
   - Check if WhatsApp is installed
   - Verify phone number format (without + or -)
   - Test deep link URL structure

3. Navigation not working:
   - Check if GPS permissions are granted
   - Verify coordinate format
   - Test with different navigation apps

4. File upload failing:
   - Check file size limits
   - Verify file type is allowed
   - Ensure upload directory exists and has write permissions

==============================================
🎉 SUMMARY
==============================================

Your journey management system now includes:

✅ Complete call tracking with duration logging
✅ WhatsApp integration with custom messages
✅ Multi-app navigation support (Google Maps, Apple Maps, Waze)
✅ Screenshot and recording upload
✅ Communication history and analytics
✅ Journey cancellation
✅ Enhanced delivery proof management

All features are fully integrated with your existing code and follow
the same patterns for consistency!

*/