import React from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView,
  TouchableOpacity, Dimensions, Linking
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../theme/ThemeContext';
import { Typography } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'ContentDetail'>;
const { width, height } = Dimensions.get('window');

export default function ContentDetailScreen({ route, navigation }: Props) {
  const { content } = route.params;
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView bounces={false} contentContainerStyle={styles.scrollContent}>
        {/* Cover Image */}
        <Image 
          source={{ uri: content.coverImageUrl || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800' }} 
          style={styles.heroImage} 
        />

        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <View style={[styles.contentWrap, { backgroundColor: colors.background }]}>
          <Text style={[styles.type, { color: colors.primary }]}>{content.type}</Text>
          <Text style={[styles.title, { color: colors.text }]}>{content.title}</Text>
          
          {content.caption ? (
            <Text style={[styles.caption, { color: colors.textSecondary }]}>"{content.caption}"</Text>
          ) : null}

          <View style={styles.divider} />

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Details</Text>
          <Text style={[styles.description, { color: colors.text }]}>{content.description}</Text>

          {content.howToReach ? (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text, marginTop: Spacing.xl }]}>How to Reach / Road Guidelines</Text>
              <Text style={[styles.description, { color: colors.text }]}>{content.howToReach}</Text>
            </>
          ) : null}

          {content.galleryUrls && content.galleryUrls.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text, marginTop: Spacing.xl }]}>Gallery</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: Spacing.sm }}>
                {content.galleryUrls.map((uri, i) => (
                  <Image key={i} source={{ uri }} style={styles.galleryImage} />
                ))}
              </ScrollView>
            </>
          )}

          {content.mediaUrl ? (
            <TouchableOpacity 
              style={[styles.mediaBtn, { backgroundColor: colors.primary }]}
              onPress={() => Linking.openURL(content.mediaUrl)}
            >
              <Text style={styles.mediaBtnText}>Watch Media / Video 🎬</Text>
            </TouchableOpacity>
          ) : null}
          
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: Spacing['2xl'] },
  heroImage: { width: '100%', height: height * 0.45 },
  backButton: {
    position: 'absolute',
    top: 50, left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: { color: '#fff', fontWeight: '700' },
  contentWrap: {
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    marginTop: -30,
    padding: Spacing.xl,
  },
  type: { fontSize: Typography.size.sm, fontWeight: '700', textTransform: 'uppercase', marginBottom: Spacing.xs },
  title: { fontSize: 24, fontWeight: '800', marginBottom: Spacing.sm },
  caption: { fontSize: 16, fontStyle: 'italic', marginBottom: Spacing.md, lineHeight: 22 },
  divider: { height: 1, backgroundColor: 'rgba(150,150,150,0.2)', marginVertical: Spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: Spacing.sm },
  description: { fontSize: 15, lineHeight: 24, opacity: 0.9 },
  galleryImage: { width: 140, height: 140, borderRadius: Radius.lg, marginRight: Spacing.md },
  mediaBtn: {
    marginTop: Spacing['2xl'],
    padding: Spacing.md,
    borderRadius: Radius.xl,
    alignItems: 'center',
  },
  mediaBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
