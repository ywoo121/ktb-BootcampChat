#!/usr/bin/env node

/**
 * Voice Features Test Script
 * Tests TTS and STT functionality without requiring full chat setup
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const API_BASE = process.env.API_URL || 'http://localhost:8080';
const TEST_TOKEN = process.env.TEST_TOKEN; // You'll need a valid JWT token for testing

// Test data
const TEST_MESSAGES = [
  { text: "Hello, this is a test message for Wayne AI.", aiType: "wayneAI" },
  { text: "Welcome to our consulting services!", aiType: "consultingAI" },
  { text: "This is a default voice test.", aiType: "default" }
];

class VoiceFeatureTester {
  constructor() {
    this.headers = {
      'Authorization': `Bearer ${TEST_TOKEN}`,
      'Content-Type': 'application/json'
    };
  }

  async testTTS() {
    console.log('\n🔊 Testing Text-to-Speech (TTS)...\n');

    for (const testMessage of TEST_MESSAGES) {
      try {
        console.log(`Testing TTS for ${testMessage.aiType}: "${testMessage.text}"`);
        
        const response = await axios.post(`${API_BASE}/api/audio/tts`, {
          text: testMessage.text,
          aiType: testMessage.aiType,
          format: 'mp3'
        }, {
          headers: this.headers,
          responseType: 'arraybuffer',
          timeout: 30000
        });

        if (response.status === 200) {
          const outputPath = path.join(__dirname, `test_tts_${testMessage.aiType}.mp3`);
          fs.writeFileSync(outputPath, response.data);
          console.log(`✅ TTS Success: Audio saved to ${outputPath} (${response.data.length} bytes)`);
        } else {
          console.log(`❌ TTS Failed: Status ${response.status}`);
        }

      } catch (error) {
        console.log(`❌ TTS Error for ${testMessage.aiType}:`, error.response?.data || error.message);
      }
      
      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  async testStreamingTTS() {
    console.log('\n🌊 Testing Streaming TTS...\n');

    try {
      const testMessage = TEST_MESSAGES[0];
      console.log(`Testing streaming TTS: "${testMessage.text}"`);

      const response = await axios.post(`${API_BASE}/api/audio/tts/stream`, {
        text: testMessage.text,
        aiType: testMessage.aiType
      }, {
        headers: this.headers,
        responseType: 'stream',
        timeout: 30000
      });

      if (response.status === 200) {
        const outputPath = path.join(__dirname, 'test_streaming_tts.mp3');
        const writer = fs.createWriteStream(outputPath);
        
        response.data.pipe(writer);
        
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        const stats = fs.statSync(outputPath);
        console.log(`✅ Streaming TTS Success: Audio saved to ${outputPath} (${stats.size} bytes)`);
      } else {
        console.log(`❌ Streaming TTS Failed: Status ${response.status}`);
      }

    } catch (error) {
      console.log('❌ Streaming TTS Error:', error.response?.data || error.message);
    }
  }

  async testSTT() {
    console.log('\n🎤 Testing Speech-to-Text (STT)...\n');

    // Create a test audio file (you would need to provide an actual audio file)
    const testAudioPath = path.join(__dirname, 'test-audio.wav');
    
    if (!fs.existsSync(testAudioPath)) {
      console.log('❌ Test audio file not found. Please create a test-audio.wav file for STT testing.');
      console.log('   You can record a short voice message and save it as test-audio.wav');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('audio', fs.createReadStream(testAudioPath));
      formData.append('language', 'ko'); // Korean

      const response = await axios.post(`${API_BASE}/api/audio/stt`, formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${TEST_TOKEN}`
        },
        timeout: 30000
      });

      if (response.status === 200) {
        console.log('✅ STT Success:');
        console.log(`   Transcription: "${response.data.transcription}"`);
        console.log(`   Language: ${response.data.language}`);
        console.log(`   Confidence: ${response.data.confidence}`);
      } else {
        console.log(`❌ STT Failed: Status ${response.status}`);
      }

    } catch (error) {
      console.log('❌ STT Error:', error.response?.data || error.message);
    }
  }

  async testVoicesAPI() {
    console.log('\n🎵 Testing Voices API...\n');

    try {
      const response = await axios.get(`${API_BASE}/api/audio/voices`, {
        headers: this.headers
      });

      if (response.status === 200) {
        console.log('✅ Voices API Success:');
        console.log('   Available voices:', Object.keys(response.data.voices));
        console.log('   AI mapping:', JSON.stringify(response.data.aiMapping, null, 2));
      } else {
        console.log(`❌ Voices API Failed: Status ${response.status}`);
      }

    } catch (error) {
      console.log('❌ Voices API Error:', error.response?.data || error.message);
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Voice Features Test Suite...');
    console.log(`API Base URL: ${API_BASE}`);
    console.log(`Test Token: ${TEST_TOKEN ? 'Provided' : 'Missing - some tests may fail'}`);

    await this.testVoicesAPI();
    
    if (TEST_TOKEN) {
      await this.testTTS();
      await this.testStreamingTTS();
      await this.testSTT();
    } else {
      console.log('\n⚠️  Skipping authenticated tests - no TEST_TOKEN provided');
      console.log('   Set TEST_TOKEN environment variable to run full test suite');
    }

    console.log('\n✨ Voice Features Test Suite Complete!');
    console.log('\nGenerated Files:');
    console.log('   - test_tts_*.mp3 (TTS output files)');
    console.log('   - test_streaming_tts.mp3 (Streaming TTS output)');
    console.log('\nTo test STT, place a test-audio.wav file in the same directory as this script.');
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  const tester = new VoiceFeatureTester();
  tester.runAllTests().catch(console.error);
}

module.exports = VoiceFeatureTester;
