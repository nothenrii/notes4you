import * as Tone from 'tone';
import { PianoKey } from '../types';
import { getNoteString } from './pianoUtils';

class AudioManager {
  private isInitialized = false;
  private isContextStarted = false;
  private currentPlayer: Tone.Player | null = null;
  private synth: Tone.Synth | null = null;
  private initializationPromise: Promise<void> | null = null;
  private audioCache = new Map<string, Tone.Player>();
  private lastNoteTime = 0;

  constructor() {
    // Pre-initialize synth for better performance
    this.synth = new Tone.Synth({
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 1
      }
    }).toDestination();
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._initialize();
    return this.initializationPromise;
  }

  private async _initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Only start Tone.js context after user interaction
      if (!this.isContextStarted) {
        await Tone.start();
        this.isContextStarted = true;
      }

      this.isInitialized = true;
    } catch (error) {
      // Failed to initialize audio context
      // Reset promise so we can try again
      this.initializationPromise = null;
      throw error;
    }
  }

  // Call this method on first user interaction
  async startAudioContext() {
    if (!this.isContextStarted) {
      try {
        await Tone.start();
        this.isContextStarted = true;
      } catch (error) {
        // Failed to start audio context
      }
    }
  }

  // Test if audio URL is accessible
  private async testAudioUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Preload audio file for better performance
  async preloadAudio(url: string): Promise<void> {
    if (this.audioCache.has(url)) {
      return; // Already cached
    }

    try {
      const isAccessible = await this.testAudioUrl(url);
      if (!isAccessible) {
        throw new Error('Audio URL not accessible');
      }

      const player = new Tone.Player({
        url: url,
        onload: () => {
          // Audio preloaded successfully
        },
        onerror: (error) => {
          // Failed to preload audio
        }
      }).toDestination();

      // Wait for the player to load with longer timeout
      await new Promise<void>((resolve, reject) => {
        const startTime = Date.now();
        const maxWaitTime = 10000; // 10 seconds timeout for preloading

        const checkLoaded = () => {
          if (player.loaded) {
            resolve();
          } else if (Date.now() - startTime > maxWaitTime) {
            reject(new Error('Audio preload timeout after 10 seconds'));
          } else {
            setTimeout(checkLoaded, 100); // Check every 100ms
          }
        };
        checkLoaded();
      });

      this.audioCache.set(url, player);
    } catch (error) {
    }
  }

  stopCurrentAudio() {
    // Stop current player if it exists
    if (this.currentPlayer) {
      this.currentPlayer.stop();
      this.currentPlayer = null;
    }
  }

  async playPianoNote(key: PianoKey, customAudioUrl?: string) {
    // Ensure audio context is started before playing
    await this.startAudioContext();
    await this.initialize();

    // Stop any currently playing audio
    this.stopCurrentAudio();

    if (customAudioUrl) {
      // Play custom audio if available
      try {

        // Check if we have this audio cached
        let player = this.audioCache.get(customAudioUrl);

        if (!player) {

          // Test if the audio URL is accessible
          const isAccessible = await this.testAudioUrl(customAudioUrl);

          if (!isAccessible) {
            throw new Error('Audio URL not accessible');
          }

          // Create a new player for the custom audio
          player = new Tone.Player({
            url: customAudioUrl,
            onload: () => {
              // Custom audio loaded successfully
            },
            onerror: (error) => {
              // Failed to load custom audio
            }
          }).toDestination();

          // Cache the player for future use
          this.audioCache.set(customAudioUrl, player);

          // Wait for the player to load before proceeding
          await new Promise<void>((resolve, reject) => {
            const startTime = Date.now();
            const maxWaitTime = 5000; // 5 seconds timeout

            const checkLoaded = () => {
              if (player && player.loaded) {
                resolve();
              } else if (Date.now() - startTime > maxWaitTime) {
                reject(new Error('Custom audio player loading timeout'));
              } else {
                setTimeout(checkLoaded, 100);
              }
            };
            checkLoaded();
          });
        }

        // Play the custom audio
        if (player) {
          this.currentPlayer = player;

          // If player is not loaded, try to reload it
          if (!player.loaded) {
            try {
              await new Promise<void>((resolve, reject) => {
                const startTime = Date.now();
                const maxWaitTime = 3000; // 3 seconds timeout

                const checkLoaded = () => {
                  if (player.loaded) {
                    resolve();
                  } else if (Date.now() - startTime > maxWaitTime) {
                    reject(new Error('Player reload timeout'));
                  } else {
                    setTimeout(checkLoaded, 100);
                  }
                };
                checkLoaded();
              });
            } catch (error) {
              throw new Error('Player not loaded');
            }
          }

          player.start();
        } else {
          throw new Error('No player available');
        }

        return;
      } catch (error) {
      }
    }

    // Play synthesized piano note
    const noteString = getNoteString(key);
    const duration = '8n'; // Eighth note duration

    try {

      // Use the pre-initialized synth with proper timing
      if (this.synth) {
        // Ensure we don't start notes too close together
        const now = Tone.now();
        if (now - this.lastNoteTime < 0.1) {
          // Wait a bit before playing the next note
          this.synth.triggerAttackRelease(noteString, duration, now + 0.1);
        } else {
          this.synth.triggerAttackRelease(noteString, duration);
        }
        this.lastNoteTime = now;
      }
    } catch (error) {
    }
  }

  setVolume(volume: number) {
    if (this.synth) {
      this.synth.volume.value = Tone.gainToDb(volume);
    }
  }

  dispose() {
    this.stopCurrentAudio();

    // Dispose cached players
    this.audioCache.forEach(player => {
      player.dispose();
    });
    this.audioCache.clear();

    // Dispose synth
    if (this.synth) {
      this.synth.dispose();
      this.synth = null;
    }
  }
}

export const audioManager = new AudioManager();