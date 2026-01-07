import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 🔴 请将下方对象替换为你在 Firebase 控制台获取的真实配置
// 就在 Project Settings -> General -> Your apps 下面
const firebaseConfig = {
  apiKey: "AIzaSyB3wDBo0CLTXeeitg2N28TbXUWtPCLmuL8",
  authDomain: "todo-4721c.firebaseapp.com",
  projectId: "todo-4721c",
  storageBucket: "todo-4721c.firebasestorage.app",
  messagingSenderId: "183301763808",
  appId: "1:183301763808:web:107b87ab0000fb05431685"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 导出我们要用的服务
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);