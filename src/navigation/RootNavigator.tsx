import React, {useEffect} from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {onAuthStateChanged} from 'firebase/auth';
import {auth} from '../firebase/config';
import {useAppDispatch, useAppSelector} from '../store';
import {setUser, clearUser, UserRole} from '../store/slices/authSlice';
import {Colors} from '../theme/colors';
import LoginScreen from '../screens/LoginScreen';
import AppNavigator from './AppNavigator';
import {createUserProfile, getUserProfile} from '../firebase/userService';

export default function RootNavigator() {
  const dispatch = useAppDispatch();
  const {status} = useAppSelector(s => s.auth);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
      if (firebaseUser) {
        try {
          // Ensure user document exists in Firestore
          await createUserProfile(firebaseUser.uid, {
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          });

          // Fetch server-controlled Custom Claims from Firebase Auth ID token
          const idTokenResult = await firebaseUser.getIdTokenResult(false);
          const claimRole = idTokenResult.claims.role as string | undefined;

          // Also read profile document from Firestore
          const profile = await getUserProfile(firebaseUser.uid);

          // Resolve effective role: Custom claims take precedence over client-accessible data
          let resolvedRole: UserRole = 'traveler';
          if (claimRole && ['admin', 'operator', 'moderator', 'traveler'].includes(claimRole)) {
            resolvedRole = claimRole as UserRole;
          } else if (profile?.role) {
            resolvedRole = profile.role === 'user' ? 'traveler' : profile.role;
          }

          dispatch(setUser({
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
            role: resolvedRole,
            customClaims: idTokenResult.claims,
          }));
        } catch (e) {
          console.warn('Error hydrating user auth profile:', e);
          dispatch(setUser({
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
            role: 'traveler',
          }));
        }
      } else {
        dispatch(clearUser());
      }
    });

    return unsubscribe;
  }, [dispatch]);

  if (status === 'idle') {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {status === 'authenticated' ? <AppNavigator /> : <LoginScreen />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
