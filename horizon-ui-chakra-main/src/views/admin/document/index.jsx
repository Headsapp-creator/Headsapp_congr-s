import React from "react";
import { useEffect, useState } from "react";

// Chakra imports
import {
  Box,
  Text,
  useColorModeValue,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Flex
} from "@chakra-ui/react";
import { FaFileAlt, FaCheckCircle, FaClock, FaUsers } from "react-icons/fa";

import Documents from "views/admin/document/components/documents";

export default function Marketplace() {
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const [communications, setCommunications] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  useEffect(() => {
    fetch("http://localhost:5000/communications")
      .then((res) => res.json())
      .then((data) => {
        setCommunications(data);

        // Calculate stats
        let total = data.length;
        let approved = 0, pending = 0, rejected = 0;
        data.forEach(comm => {
          const scores = comm.scores || [];
          if (!scores.length) {
            pending++;
          } else {
            let avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            avg = Math.min(avg, 10);
            if (avg >= 8) approved++;
            else if (avg >= 5) pending++;
            else rejected++;
          }
        });
        setStats({ total, approved, pending, rejected });
      })
      .catch((err) => console.error("Error fetching communications:", err));
  }, []);

  const statItems = [
    { label: "Total Communications", value: stats.total, icon: FaFileAlt },
    { label: "Pending Review", value: stats.pending, icon: FaClock },
    { label: "Approved", value: stats.approved, icon: FaCheckCircle },
    { label: "Rejected", value: stats.rejected, icon: FaUsers },
  ];

  return (
    <Box pt={{ base: "80px", md: "80px", xl: "80px" }}>
      <Text mb={8} color="gray.500">
        Manage all submitted communications and track their status
      </Text>

      {/* Stats Grid */}
      <SimpleGrid columns={{ base: 1, md: 4 }} gap={4} mb={8}>
        {statItems.map((stat, index) => (
          <Stat key={index} p={4} bg="white" borderRadius="md" boxShadow="sm">
            <Flex justifyContent="space-between" alignItems="center">
              <Box>
                <StatLabel color="gray.500">{stat.label}</StatLabel>
                <StatNumber color={textColor}>{stat.value}</StatNumber>
              </Box>
              <Box as={stat.icon} size="24px" color="blue.500" />
            </Flex>
          </Stat>
        ))}
      </SimpleGrid>

      <Documents tableData={communications} />
    </Box>
  );
}