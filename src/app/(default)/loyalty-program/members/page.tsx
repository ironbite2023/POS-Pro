'use client';

import { useState } from 'react';
import { Box, Flex, Button, Table, Badge, Avatar, TextField, Grid, Text } from '@radix-ui/themes';
import { Plus, Search, User, Gift, TrendingUp } from 'lucide-react';
import { PageHeading } from '@/components/common/PageHeading';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useLoyaltyData } from '@/hooks/useLoyaltyData';
import { format } from 'date-fns';
import MemberForm from '@/components/loyalty-program/MemberForm';
import MemberProfile from '@/components/loyalty-program/MemberProfile';
import StatsCard from '@/components/common/StatsCard';

export default function MembersPage() {
  usePageTitle('Loyalty Program Members');
  const { members, tiers, metrics, loading, error, refetchMembers } = useLoyaltyData();
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMembers = members.filter(member => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      member.first_name?.toLowerCase().includes(searchLower) ||
      member.last_name?.toLowerCase().includes(searchLower) ||
      member.email?.toLowerCase().includes(searchLower) ||
      member.member_number.toLowerCase().includes(searchLower) ||
      member.phone?.toLowerCase().includes(searchLower)
    );
  });

  const handleMemberClick = (member: any) => {
    setSelectedMember(member);
    setShowProfile(true);
  };

  const getTierColor = (tierColor: string | null): React.ComponentProps<typeof Badge>['color'] => {
    if (!tierColor) return 'gray';
    const colorMap: Record<string, React.ComponentProps<typeof Badge>['color']> = {
      'blue': 'blue',
      'green': 'green',
      'orange': 'orange',
      'purple': 'purple',
      'red': 'red',
      'gold': 'amber',
    };
    return colorMap[tierColor.toLowerCase()] || 'gray';
  };

  if (error) {
    return (
      <Box>
        <Text color="red">Error loading loyalty data: {error.message}</Text>
      </Box>
    );
  }

  return (
    <Box className="space-y-6">
      <Flex 
        direction={{ initial: "column", sm: "row" }} 
        justify="between" 
        align={{ initial: "stretch", sm: "center" }}
        gap={{ initial: "4", sm: "0" }}
        mb="5"
      >
        <PageHeading
          title="Loyalty Program Members"
          description="Manage and track your loyalty program members"
          noMarginBottom
        />
        <Box width={{ initial: "full", sm: "auto" }}>
          <Button 
            onClick={() => setShowForm(true)} 
            className="w-full sm:w-auto"
            disabled={loading}
          >
            <Plus size={16} />
            Add Member
          </Button>
        </Box>
      </Flex>

      {/* Metrics */}
      <Grid columns={{ initial: '1', sm: '2', md: '4' }} gap="4">
        <StatsCard
          title="Total Members"
          value={metrics.totalMembers.toString()}
          icon={<User size={20} />}
          loading={loading}
        />
        
        <StatsCard
          title="Points Issued"
          value={metrics.totalPointsIssued.toLocaleString()}
          icon={<Gift size={20} />}
          loading={loading}
        />
        
        <StatsCard
          title="Points Redeemed"
          value={metrics.totalPointsRedeemed.toLocaleString()}
          icon={<TrendingUp size={20} />}
          loading={loading}
        />
        
        <StatsCard
          title="Avg Points/Member"
          value={Math.round(metrics.averagePointsPerMember).toString()}
          icon={<User size={20} />}
          loading={loading}
        />
      </Grid>

      {/* Search */}
      <Box>
        <TextField.Root
          placeholder="Search members by name, email, or member number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        >
          <TextField.Slot>
            <Search size={16} />
          </TextField.Slot>
        </TextField.Root>
      </Box>

      {/* Members Table */}
      {loading ? (
        <Text>Loading members...</Text>
      ) : filteredMembers.length === 0 ? (
        <Box className="text-center py-12">
          <Text size="3" color="gray">
            {searchTerm ? 'No members match your search' : 'No members enrolled yet'}
          </Text>
        </Box>
      ) : (
        <Table.Root variant="surface">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Member</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Member #</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Current Points</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Tier</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Enrolled</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filteredMembers.map((member) => (
              <Table.Row 
                key={member.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleMemberClick(member)}
              >
                <Table.Cell>
                  <Flex align="center" gap="2">
                    <Avatar
                      size="2"
                      fallback={`${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`}
                    />
                    <Box>
                      <Text weight="medium">
                        {member.first_name} {member.last_name}
                      </Text>
                      <Text size="1" color="gray">{member.email}</Text>
                    </Box>
                  </Flex>
                </Table.Cell>
                <Table.Cell>
                  <Text size="2" color="gray">{member.member_number}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Text weight="bold" color="blue">
                    {member.current_points || 0}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Badge color={getTierColor((member as any).tier?.tier_color)}>
                    {(member as any).tier?.name || 'No Tier'}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <Text size="2">
                    {member.joined_at ? format(new Date(member.joined_at), 'MMM dd, yyyy') : 'N/A'}
                  </Text>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      )}

      {/* Member Form */}
      <MemberForm
        member={selectedMember}
        tiers={tiers}
        open={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={() => {
          refetchMembers();
          setSelectedMember(null);
        }}
      />

      {/* Member Profile */}
      {selectedMember && (
        <MemberProfile
          member={selectedMember}
          open={showProfile}
          onClose={() => setShowProfile(false)}
          onUpdate={() => {
            refetchMembers();
          }}
        />
      )}
    </Box>
  );
}
