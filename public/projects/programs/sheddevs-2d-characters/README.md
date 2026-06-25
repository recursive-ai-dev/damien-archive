# 🎮 2D Character Generator

A robust, production-ready 2D character generator built with Next.js, TypeScript, and modern web technologies. Create pixel-perfect characters with customizable attributes, animations, and themes for game development and creative projects.

## ✨ Features

### 🎨 Character Customization
- **6 Species Types**: Human, Large Fantasy, Small Fantasy, Beast, Spectral, Machine
- **4 Age Categories**: Young, Middle Age, Old, Undead
- **3 Size Variations**: Small, Medium, Large
- **Mood & Wealth Options**: At Peace/In Chaos, Poor/Middle Class/Rich
- **Strength Levels**: Frail, Weak, Strong, Powerful

### 🎭 Animation System
- **Multiple Easing Functions**: Smooth, linear, and custom animation curves
- **Directional Animations**: Idle, walk, run, jump with secondary motion effects
- **Playback Controls**: Adjustable speed, looping, and frame-by-frame preview
- **Real-time Animation Tracks**: Visualize animation data and timing

### 🎨 Theme Engine
- **10 Built-in Themes**: Forest, Fire, Ice, Desert, Ocean, and more
- **Color Harmony Generation**: Automatic palette creation with accessibility support
- **Lighting Simulation**: Dynamic lighting effects based on theme
- **Custom Theme Blending**: Mix and match theme elements

### 🖼️ Sprite Sheet Export
- **Game Engine Ready**: Export sprite sheets with metadata JSON
- **Configurable Layouts**: Adjust rows, columns, and spacing
- **Multiple Formats**: PNG sprite sheets with transparency
- **Unity/Godot Compatible**: Standardized format for easy integration

### 🔧 Technical Features
- **Procedural Generation**: Algorithmically generated characters with consistent proportions
- **Superellipse Rendering**: Smooth pixel-perfect character shapes
- **Physics-based Constraints**: Realistic body proportions and movement
- **Type-safe Configuration**: Full TypeScript support with Zod validation

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to access the character generator.

## 📁 Project Structure

```
src/
├── app/
│   └── page.tsx              # Main application page
├── components/
│   ├── character/            # Character-related components
│   │   ├── CharacterPreview.tsx  # Character customization UI
│   │   ├── AnimationPlayer.tsx  # Animation playback controls
│   │   └── SpriteSheetExporter.tsx # Sprite sheet export functionality
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── character/            # Character generation core
│   │   ├── generator.ts       # Character geometry generator
│   │   ├── types.ts          # Type definitions
│   │   └── ...
│   ├── animation/            # Animation system
│   │   ├── clips.ts          # Animation clips
│   │   ├── easing.ts         # Easing functions
│   │   └── ...
│   ├── theme/                # Theme engine
│   │   ├── engine.ts         # Theme application logic
│   │   ├── default-themes.ts  # Built-in themes
│   │   └── ...
│   └── utils.ts              # Utility functions
└── public/                   # Static assets
```

## 🎮 Usage

### Character Creation
1. **Select Species**: Choose from 6 different character types
2. **Customize Attributes**: Adjust age, size, mood, wealth, and strength
3. **Apply Theme**: Select from 10 built-in themes or create custom ones
4. **Preview**: See real-time character rendering with pixel-perfect accuracy

### Animation
1. **Play/Pause**: Control animation playback
2. **Adjust Speed**: Modify animation speed with slider controls
3. **Frame Navigation**: Step through animations frame-by-frame
4. **Animation Types**: Choose from idle, walk, run, jump, and custom animations

### Export
1. **Select Animations**: Choose which animations to include in sprite sheet
2. **Configure Layout**: Set rows, columns, and spacing
3. **Export**: Download sprite sheet PNG and metadata JSON
4. **Game Integration**: Import directly into Unity, Godot, or custom engines

## 🔧 Character Generation Algorithm

The character generator uses a procedural approach with:

- **Proportional Scaling**: Body parts scale relative to base size
- **Superellipse Shapes**: Smooth, pixel-perfect character outlines
- **Physics Constraints**: Realistic body proportions and movement limits
- **Clothing Simulation**: Dynamic robe and clothing physics
- **Theme Application**: Color mapping with lighting simulation

### Key Parameters
- `base_size`: Character height in pixels (default: 64)
- `head_r`: Head size ratio
- `torso_r`: Torso size ratio  
- `legs_r`: Leg size ratio
- `head_n`: Head shape factor (superellipse exponent)
- `waist_t`: Waist tapering factor
- `leg_gap`: Space between legs
- `arm_thickness`: Arm width based on strength

## 📊 Animation System

### Easing Functions
- Linear
- Ease-in/out
- Bounce
- Elastic
- Custom bezier curves

### Animation Clips
- **Idle**: Breathing and subtle movements
- **Walk**: 4-directional walking cycle
- **Run**: Faster movement with secondary motion
- **Jump**: Arc trajectory with landing impact
- **Custom**: User-defined animation sequences

### Playback Features
- Adjustable speed (50-500ms per frame)
- Looping control
- Frame-by-frame navigation
- Real-time animation track visualization

## 🎨 Theme Engine

### Built-in Themes
1. **Forest Theme**: Greens and browns with natural lighting
2. **Fire Theme**: Reds and oranges with warm glow
3. **Ice Theme**: Blues and whites with cool tones
4. **Desert Theme**: Yellows and beiges with harsh lighting
5. **Ocean Theme**: Blues and teals with water effects
6. **Mountain Theme**: Grays and whites with rocky textures
7. **City Theme**: Urban colors with neon accents
8. **Fantasy Theme**: Magical purples and golds
9. **Sci-Fi Theme**: Metallic blues and silvers
10. **Horror Theme**: Dark tones with eerie lighting

### Theme Customization
- Primary/secondary color selection
- Lighting direction and intensity
- Color harmony rules
- Accessibility contrast adjustments
- Custom theme blending

## 🖼️ Sprite Sheet Export

### Export Options
- **Animation Selection**: Choose which animations to include
- **Layout Configuration**: Rows × Columns grid
- **Spacing**: Pixel spacing between sprites
- **Format**: PNG with transparency
- **Metadata**: JSON file with frame data and timing

### Game Engine Integration
```javascript
// Example: Loading sprite sheet in game engine
const spriteSheet = new Image();
spriteSheet.src = 'character_spritesheet.png';

const metadata = require('./character_metadata.json');

// Access individual frames
const idleFrames = metadata.animations.idle.frames;
const walkFrames = metadata.animations.walk.frames;
```

## 📋 Character Specifications

Each generated character includes detailed specifications:

```typescript
interface CharacterSpec {
  cx: number;              // Center X coordinate
  top_margin: number;      // Top margin
  bottom_margin: number;   // Bottom margin
  head_h: number;          // Head height
  head_rx: number;          // Head width radius
  head_ry: number;          // Head height radius
  head_n: number;          // Head shape factor
  torso_h: number;         // Torso height
  leg_h: number;           // Leg height
  s_half: number;          // Shoulder half-width
  w_half: number;          // Waist half-width
  h_half: number;          // Hip half-width
  waist_t: number;         // Waist tapering
  leg_gap: number;         // Leg gap
  w_min: number;           // Minimum waist width
  arm_thickness: number;    // Arm thickness
  robe: boolean;           // Has robe
  robe_len_px: number;      // Robe length
  robe_flare_px: number;    // Robe flare
  robe_closure: number;     // Robe closure
  robe_hip_extra_px: number;// Robe hip extra
  // Metadata
  species: string;
  size: string;
  age: string;
  strength: string;
  wealth: string;
  mood: string;
  base_size: number;
}
```

## 🧪 Verification & Testing

### Character Generation Tests
- **Proportion Validation**: Ensure body parts sum to correct height
- **Constraint Testing**: Verify physics constraints are respected
- **Edge Case Handling**: Test extreme parameter values
- **Theme Application**: Validate color mapping and lighting

### Animation Tests
- **Frame Consistency**: Verify animation frames maintain proportions
- **Timing Accuracy**: Test frame timing and duration
- **Loop Validation**: Ensure seamless animation looping
- **Easing Functions**: Validate smooth transitions

### Export Tests
- **Sprite Sheet Validation**: Verify correct frame layout
- **Metadata Accuracy**: Test JSON metadata correctness
- **Format Compliance**: Ensure compatibility with game engines
- **Transparency Testing**: Validate alpha channel handling

## 🚀 Production Deployment

### Build Optimization
```bash
npm run build
```

### Server Configuration
```bash
NODE_ENV=production npm start
```

### Environment Variables
Create a `.env.local` file for production configuration:
```
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature`
3. **Commit changes**: `git commit -m 'Add some feature'`
4. **Push to branch**: `git push origin feature/your-feature`
5. **Open a pull request**

### Development Guidelines
- Follow existing code style and patterns
- Add TypeScript types for new functionality
- Include tests for new features
- Update documentation as needed
- Maintain backward compatibility

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ for game developers and creative artists. Powered by modern web technologies 🚀
