import React from 'react';
import { Box, Card, Flex, Heading, Text, Table } from '@radix-ui/themes';
// Removed hardcoded import - using real user profiles from database
import type { Database } from '@/lib/supabase/database.types';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
import { format } from 'date-fns';

interface ActivityLog {
  timestamp: string;
  action: string;
}

interface ActivityLogTabProps {
  user: UserProfile & { activityLog?: ActivityLog[] };
}

export default function ActivityLogTab({ user }: ActivityLogTabProps) {
  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  return (
    <Box>
      {user.activityLog && user.activityLog.length > 0 ? (
        <Table.Root variant="surface">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Timestamp</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Action</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          
          <Table.Body>
            {user.activityLog.map((activity, index) => (
              <Table.Row key={index}>
                <Table.Cell>
                  {formatTimestamp(activity.timestamp)}
                </Table.Cell>
                <Table.Cell>{activity.action}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      ) : (
        <Flex align="center" justify="center" height="200px" direction="column" gap="2">
          <Text size="3" weight="medium">No Activity Recorded</Text>
          <Text size="2" color="gray">This user has no activity history yet</Text>
        </Flex>
      )}
    </Box>
  );
} 