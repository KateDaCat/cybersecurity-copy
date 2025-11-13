import React, { useMemo, useState } from 'react';
import { SafeAreaView, Text, StyleSheet, View, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ADMIN_USER_DETAIL } from '../../navigation/routes';

const INITIAL_USERS = [
  {
    user_id: 1,
    username: 'flora_admin',
    role: 'Admin',
    email: 'flora@smartplant.dev',
    phone: '+60 12-345 6789',
    active: true,
    created_at: '2024-06-10T09:45:00Z',
  },
  {
    user_id: 2,
    username: 'ranger.sam',
    role: 'Plant Researcher',
    email: 'sam@smartplant.dev',
    phone: '+60 13-222 1111',
    active: false,
    created_at: '2024-08-21T14:20:00Z',
  },
  {
    user_id: 3,
    username: 'data.joy',
    role: 'User',
    email: 'joy@smartplant.dev',
    phone: '+60 17-555 6666',
    active: true,
    created_at: '2025-01-04T11:05:00Z',
  },
];

export default function AdminUsersScreen() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation();

  const handleUserUpdate = (updatedUser) => {
    if (!updatedUser || typeof updatedUser.user_id === 'undefined') {
      return;
    }
    setUsers((prev) =>
      prev.map((user) =>
        user.user_id === updatedUser.user_id ? { ...user, ...updatedUser } : user
      )
    );
  };

  const filteredUsers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return users
      .filter((user) => {
        if (!normalizedQuery) return true;
        return (
          user.username.toLowerCase().includes(normalizedQuery) ||
          user.phone.toLowerCase().includes(normalizedQuery) ||
          String(user.user_id).includes(normalizedQuery)
        );
      })
      .sort((a, b) => a.username.localeCompare(b.username));
  }, [searchQuery, users]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>User Directory</Text>
        <Text style={styles.subtitle}>Search, manage access, and review roles.</Text>
      </View>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by username, phone, or ID"
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton} accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.list}>
        {filteredUsers.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={20} color="#94A3B8" />
            <Text style={styles.emptyStateText}>No users found. Try a different search.</Text>
          </View>
        )}
        {filteredUsers.map((user) => (
            <View key={user.user_id} style={styles.card}>
              <Text style={[styles.username, !user.active && styles.usernameInactive]}>
                {user.username}
              </Text>
              <View style={styles.metaRow}>
                <View style={styles.metaTextCol}>
                  <Text style={styles.metaId}>User ID: {user.user_id}</Text>
                  <Text style={styles.phone}>{user.phone}</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.75}
                  style={styles.viewButton}
                  onPress={() =>
                    navigation.navigate(ADMIN_USER_DETAIL, {
                      user,
                      onUpdate: handleUserUpdate,
                    })
                  }
                >
                  <Text style={styles.viewButtonText}>View</Text>
                </TouchableOpacity>
              </View>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#F5F6F8',
  },
  header: {
    gap: 4,
    marginTop: 4,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E2D3D',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  list: {
    marginTop: 24,
    gap: 16,
  },
    searchBar: {
      marginTop: 16,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E2E8F0',
      gap: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 13.5,
      color: '#0F172A',
    },
    clearButton: {
      padding: 4,
    },
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: '#E4E9EE',
      gap: 4,
    },
    username: {
      fontSize: 17,
      fontWeight: '600',
      color: '#23364B',
    },
    usernameInactive: {
      color: '#9CA3AF',
    },
    phone: {
      marginTop: 4,
      fontSize: 12.5,
      color: '#5F6F7E',
    },
    metaId: {
      marginTop: 2,
      fontSize: 11,
      color: '#7A8996',
      letterSpacing: 0.3,
    },
    metaRow: {
      marginTop: 4,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    metaTextCol: {
      gap: 2,
    },
    viewButton: {
      alignSelf: 'flex-end',
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 9,
      backgroundColor: '#1E88E5',
    },
    viewButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    emptyState: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      paddingVertical: 32,
      paddingHorizontal: 20,
      borderWidth: 1,
      borderColor: '#E4E9EE',
      alignItems: 'center',
      gap: 10,
    },
    emptyStateText: {
      fontSize: 13,
      color: '#64748B',
      textAlign: 'center',
    },
});
