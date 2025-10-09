import React from 'react';
import { Box, Card, Checkbox, Flex, Grid, Heading, Separator, Text, TextField } from '@radix-ui/themes';
// Removed hardcoded import - using real branch data from context
import { useOrganization } from '@/contexts/OrganizationContext';
import type { Database } from '@/lib/supabase/database.types';

type Branch = Database['public']['Tables']['branches']['Row'];
import CardHeading from '@/components/common/CardHeading';

interface ServicesHoursTabProps {
  branch: Branch;
  onUpdate: (updates: Partial<Branch>) => void;
}

export default function ServicesHoursTab({ branch, onUpdate }: ServicesHoursTabProps) {
  // Parse services from JSON
  const services = typeof branch.services === 'object' && branch.services !== null 
    ? (branch.services as any) 
    : { dineIn: false, takeaway: false, delivery: false };
  
  // Parse business hours from JSON  
  const businessHours = typeof (branch as any).business_hours === 'object' && (branch as any).business_hours !== null
    ? (branch as any).business_hours
    : [];
  
  // Update service status
  const handleServiceChange = (service: 'dineIn' | 'takeaway' | 'delivery', checked: boolean) => {
    onUpdate({
      services: {
        ...services,
        [service]: checked
      }
    });
  };
  
  // Update business hours
  const handleHoursChange = (
    index: number, 
    field: 'isOpen' | 'openTime' | 'closeTime', 
    value: boolean | string
  ) => {
    const updatedHours = [...businessHours];
    updatedHours[index] = {
      ...updatedHours[index],
      [field]: value
    };
    
    (onUpdate as any)({ business_hours: updatedHours });
  };
  
  return (
    <Box className="space-y-4">
      <Card size="3">
        <CardHeading title="Services Offered" />
        <Flex 
          direction={{ initial: "column", sm: "row" }}
          gap={{ initial: "3", sm: "4" }}
          align={{ initial: "stretch", sm: "center" }}
        >
          <Text as="label" weight="medium">
            <Flex gap="2" align="center">
              <Checkbox 
                checked={services.dineIn || false}
                onCheckedChange={(checked) => 
                  handleServiceChange('dineIn', checked as boolean)
                }
              />
              Dine-in
            </Flex>
          </Text>
            
          <Text as="label" weight="medium">
            <Flex gap="2" align="center">
              <Checkbox 
                checked={services.takeaway || false}
                onCheckedChange={(checked) => 
                  handleServiceChange('takeaway', checked as boolean)
                }
              />
              Takeaway
            </Flex>
          </Text>
          
          <Text as="label" weight="medium">
            <Flex gap="2" align="center">
              <Checkbox 
                checked={services.delivery || false}
                onCheckedChange={(checked) => 
                  handleServiceChange('delivery', checked as boolean)
                }
              />
              Delivery
            </Flex>
          </Text>
        </Flex>
      </Card>
      <Card size="3">
        <CardHeading title="Business Hours" />
        
        {businessHours.map((hours: any, index: number) => (
          <Flex 
            key={hours.day} 
            direction={{ initial: "column", sm: "row" }}
            align={{ initial: "stretch", sm: "center" }}
            gap={{ initial: "3", sm: "4" }}
            mb="3"
          >
            <Box style={{ width: '100px' }}>
              <Text size="2">{hours.day}</Text>
            </Box>
            
            <Flex 
              direction={{ initial: "row", sm: "row" }}
              gap="2" 
              align="center"
            >
              <Checkbox 
                checked={hours.isOpen}
                onCheckedChange={(checked) => 
                  handleHoursChange(index, 'isOpen', checked as boolean)
                }
              />
              <Text size="2">Open</Text>
            </Flex>
            
            {hours.isOpen ? (
              <Flex 
                direction={{ initial: "column", sm: "row" }}
                gap={{ initial: "2", sm: "2" }}
                align={{ initial: "stretch", sm: "center" }}
                className="w-full sm:w-auto"
              >
                <TextField.Root 
                  type="time"
                  value={hours.openTime}
                  onChange={(e) => 
                    handleHoursChange(index, 'openTime', e.target.value)
                  }
                  className="w-full sm:w-[120px]"
                />
                <Text className="text-center">to</Text>
                <TextField.Root 
                  type="time"
                  value={hours.closeTime}
                  onChange={(e) => 
                    handleHoursChange(index, 'closeTime', e.target.value)
                  }
                  className="w-full sm:w-[120px]"
                />
              </Flex>
            ) : (
              <Text color="gray">Closed</Text>
            )}
          </Flex>
        ))}
      </Card>
    </Box>
  );
} 