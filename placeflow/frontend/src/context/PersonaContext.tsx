import React, { createContext, useContext, useState } from 'react';
import { Persona } from '../app/navigation';

export type UserPersona = Persona;

export interface PersonaConfig {
  id: UserPersona;
  title: string;
  badgeLabel: string;
  roleDescription: string;
  avatarInitials: string;
}

export const PERSONA_CONFIGS: Record<UserPersona, PersonaConfig> = {
  TPO: {
    id: 'TPO',
    title: 'Placement Directorate',
    badgeLabel: 'TPO Officer',
    roleDescription: 'Office of Career & Placement Services',
    avatarInitials: 'TP',
  },
  STUDENT: {
    id: 'STUDENT',
    title: 'Student Workbench',
    badgeLabel: 'Student',
    roleDescription: 'B.Tech Computer Science & Engineering',
    avatarInitials: 'AS',
  },
  FACULTY: {
    id: 'FACULTY',
    title: 'Faculty Teaching Workbench',
    badgeLabel: 'Faculty',
    roleDescription: 'Department of Computing',
    avatarInitials: 'FA',
  },
  HOD: {
    id: 'HOD',
    title: 'Department Leadership',
    badgeLabel: 'HOD / Dean',
    roleDescription: 'School of Computing & Engineering',
    avatarInitials: 'HD',
  },
  MANAGEMENT: {
    id: 'MANAGEMENT',
    title: 'Executive Institutional Command',
    badgeLabel: 'Leadership',
    roleDescription: 'Office of the Vice Chancellor / Registrar',
    avatarInitials: 'VC',
  },
  ADMIN: {
    id: 'ADMIN',
    title: 'Institutional Administration',
    badgeLabel: 'Campus Admin',
    roleDescription: 'Platform Architecture & IAM Governance',
    avatarInitials: 'AD',
  },
};

interface PersonaContextType {
  activePersona: UserPersona;
  personaConfig: PersonaConfig;
  switchPersona: (persona: UserPersona) => void;
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined);

export const PersonaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePersona, setActivePersona] = useState<UserPersona>(() => {
    const saved = localStorage.getItem('placeflow_persona') as string;
    if (saved === 'TPO_PLACEMENT') return 'TPO';
    if (saved === 'HOD_DEAN') return 'HOD';
    return (saved && PERSONA_CONFIGS[saved as UserPersona]) ? (saved as UserPersona) : 'TPO';
  });

  const switchPersona = (persona: UserPersona) => {
    setActivePersona(persona);
    localStorage.setItem('placeflow_persona', persona);
  };

  const personaConfig = PERSONA_CONFIGS[activePersona] || PERSONA_CONFIGS.TPO;

  return (
    <PersonaContext.Provider value={{ activePersona, personaConfig, switchPersona }}>
      {children}
    </PersonaContext.Provider>
  );
};

export const usePersona = () => {
  const context = useContext(PersonaContext);
  if (!context) {
    throw new Error('usePersona must be used within a PersonaProvider');
  }
  return context;
};
