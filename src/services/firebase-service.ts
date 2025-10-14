// src/services/firebase-service.ts
// This service connects to the real Firebase backend
import { auth } from '../boot/firebase';

const FIREBASE_API_URL =
  'https://us-central1-spoileralert-firebase.cloudfunctions.net/api';

export class FirebaseService {
  // Helper to get auth token
  private static async getAuthToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  }

  // Helper to make authenticated requests
  private static async makeRequest(
    endpoint: string,
    method: string = 'GET',
    body?: any
  ): Promise<any> {
    const token = await this.getAuthToken();

    const headers: any = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${FIREBASE_API_URL}${endpoint}`, options);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  // Get user's shows
  static async getMyShows(): Promise<any[]> {
    return await this.makeRequest('/get-my-shows');
  }

  // Get user's show IDs
  static async getMyShowIDs(): Promise<any[]> {
    return await this.makeRequest('/get-my-show-ids');
  }

  // Add show to user's list
  static async addShow(showData: any): Promise<any> {
    return await this.makeRequest('/add-show', 'POST', showData);
  }

  // Get posts for a show
  static async getPosts(showId: string): Promise<any[]> {
    return await this.makeRequest(`/get-posts/${showId}`);
  }

  // Add post
  static async addPost(
    showId: string,
    season: number,
    episode: number,
    post: string
  ): Promise<any> {
    return await this.makeRequest('/add-post', 'POST', {
      show_id: showId,
      season,
      episode,
      post,
    });
  }

  // Add comment
  static async addComment(postId: string, comment: string): Promise<any> {
    return await this.makeRequest('/add-comment', 'POST', {
      post_id: postId,
      post: comment,
    });
  }

  // Get user's latest season/episode
  static async getUserLatestSeasonEpisode(showId: string): Promise<any> {
    return await this.makeRequest(`/get-user-latest-season-episode/${showId}`);
  }

  // Set user's latest season/episode
  static async setSeasonEpisode(
    showId: string,
    season: number,
    episode: number,
    episodeLabel: string,
    episodeIndex: number
  ): Promise<any> {
    return await this.makeRequest('/set-season-episode', 'POST', {
      show_id: showId,
      season,
      episode,
      episode_label: episodeLabel,
      episode_index: episodeIndex,
    });
  }

  // Check if user exists
  static async userExists(email: string): Promise<boolean> {
    const result = await this.makeRequest('/user-exists', 'POST', { email });
    return result === true || result.exists === true;
  }

  // Add new user
  static async addUser(
    email: string,
    password: string,
    handle: string
  ): Promise<any> {
    return await this.makeRequest('/add-user', 'POST', {
      email,
      password,
      handle,
    });
  }
}

