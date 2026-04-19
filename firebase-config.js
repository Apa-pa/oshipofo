'use strict';

// ユーザー提供のFirebase設定
const firebaseConfig = {
  apiKey: "AIzaSyCpyfgzrUm4vynEBJ1DEcfyZh1gGiwMPoc",
  authDomain: "oshipofo.firebaseapp.com",
  projectId: "oshipofo",
  databaseURL: "https://oshipofo-default-rtdb.firebaseio.com",
  storageBucket: "oshipofo.firebasestorage.app",
  messagingSenderId: "473622110066",
  appId: "1:473622110066:web:f360f8e888cb04867747eb",
  measurementId: "G-0FDDMSQC5D"
};

// Firebaseの初期化 (compatモジュール前提)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
