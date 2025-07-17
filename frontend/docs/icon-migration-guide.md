# Icon Migration Guide: lucide-react to @vapor-ui/icons

This guide provides a comprehensive mapping of lucide-react icons to their @vapor-ui/icons equivalents for the BootcampChat application.

## Icon Mapping Table

| lucide-react Icon | Vapor UI Icon | Usage Context | Notes |
|-------------------|---------------|---------------|-------|
| **Alert & Status Icons** |
| AlertCircle | ErrorCircleIcon | Error states, validation errors | Direct replacement |
| AlertTriangle | WarningIcon | Warning messages, cautions | Direct replacement |
| Info | InfoCircleIcon | Information messages | Direct replacement |
| CheckCircle, CheckCircle2 | CheckCircleIcon | Success states | Direct replacement |
| **Check & Status** |
| Check | CheckIcon | Single checkmark | May need custom Check icon |
| CheckCheck | CheckIcon | Read receipts (double check) | Use single check or custom solution |
| **Action Icons** |
| Send | SendIcon | Send message button | Direct replacement |
| Copy | CopyIcon | Copy to clipboard | Direct replacement |
| RefreshCcw | RefreshOutlineIcon | Refresh/reload | Direct replacement |
| **Media Icons** |
| Camera | CameraIcon | Profile photo upload | Direct replacement |
| Image | ImageIcon | Image files | Direct replacement |
| Video, Film | MovieIcon | Video files | Both map to MovieIcon |
| Music | SoundOnIcon | Audio files | Alternative icon |
| **File Icons** |
| File | FileIcon | Generic files | Direct replacement |
| FileText | PdfIcon | Document files | Alternative for documents |
| FileCode2 | CodeBlockIcon | Code files | Direct replacement |
| Paperclip | AttachFileOutlineIcon | File attachments | Direct replacement |
| **UI Controls** |
| X | CloseOutlineIcon | Close/dismiss buttons | Direct replacement |
| XCircle | ErrorCircleIcon | Error with close | Alternative usage |
| ChevronDown | CaretDownIcon | Dropdown arrows | Direct replacement |
| **Time & Security** |
| Timer, Clock | TimeIcon | Time-related UI | Both map to TimeIcon |
| Lock, LockKeyhole | LockIcon | Locked/private rooms | Both map to LockIcon |
| **Communication** |
| Mail | MailIcon | Email address fields | Direct replacement |
| Users | GroupIcon | User groups, chat rooms | Direct replacement |
| **Network & Links** |
| WifiOff | NetworkIcon | Offline state | Needs visual indicator for "off" |
| ExternalLink | LinkOutlineIcon | External links | Direct replacement |
| **Emoji & Expression** |
| Smile, SmilePlus | AiGoormeeIcon | Emoji picker | Using mascot as alternative |
| PartyPopper | StarIcon | Celebration/success | Alternative icon |

## Migration Examples

### Example 1: Alert Component
```javascript
// Before
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

// After
import { 
  ErrorCircleIcon, 
  CheckCircleIcon, 
  InfoCircleIcon, 
  WarningIcon, 
  CloseOutlineIcon 
} from '@vapor-ui/icons';
```

### Example 2: Chat Input
```javascript
// Before
import { Smile, Paperclip, Send } from 'lucide-react';

// After
import { AiGoormeeIcon, AttachFileOutlineIcon, SendIcon } from '@vapor-ui/icons';
```

### Example 3: File Message
```javascript
// Before
import { FileText, Image, Film, Music, ExternalLink, Download } from 'lucide-react';

// After
import { 
  PdfIcon, 
  ImageIcon, 
  MovieIcon, 
  SoundOnIcon, 
  LinkOutlineIcon, 
  DownloadIcon 
} from '@vapor-ui/icons';
```

## Special Considerations

### 1. Double Check Icon (Read Receipts)
The Vapor UI library doesn't have a double-check icon. Options:
- Use single CheckIcon
- Create a custom component with two CheckIcons
- Request addition of CheckCheckIcon to Vapor UI

### 2. Emoji Icons
Vapor UI doesn't have dedicated emoji icons. We're using AiGoormeeIcon as a friendly alternative for emoji-related actions.

### 3. Text Formatting Icons
For markdown toolbar icons (Bold, Italic, Code, etc.), consider:
- Using TextOutlineIcon as a generic text icon
- Creating custom SVG icons
- Using icon fonts or Unicode symbols

### 4. Network Status
WifiOff doesn't have a direct equivalent. Use NetworkIcon with additional styling to indicate offline state.

## Implementation Strategy

1. **Phase 1**: Update imports in all components
2. **Phase 2**: Replace icon usage in JSX
3. **Phase 3**: Test visual appearance and adjust sizes if needed
4. **Phase 4**: Handle special cases (double check, emojis, etc.)

## Component-Specific Notes

### Toast Component
- Uses multiple status icons
- May need to adjust icon colors based on toast type

### Chat Messages
- Read receipts need special handling for double check
- File type icons should maintain clear visual distinction

### Profile Upload
- Camera icon works directly
- Consider adding hover states

### Connection Status
- WifiOff needs custom styling or alternative approach
- Consider using NetworkIcon with a red color or strikethrough