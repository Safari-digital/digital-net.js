import { StringResolver } from '@digital-net-org/digital-core';
import { type DnEntityIdentifier } from '../types';

export function buildCreateTitle({ singular, gender }: DnEntityIdentifier): string {
    return `Créer ${gender === 'f' ? 'une nouvelle' : 'un nouveau'} ${singular}`;
}

export function buildDeleteTitle({ singular, gender }: DnEntityIdentifier): string {
    return `Supprimer ${gender === 'f' ? 'la' : 'le'} ${singular}`;
}

export function buildCreatedToast({ singular, gender }: DnEntityIdentifier): string {
    return `${StringResolver.capitalize(singular)} ${gender === 'f' ? 'créée' : 'créé'}`;
}

export function buildDeletedToast({ singular, gender }: DnEntityIdentifier): string {
    return `${StringResolver.capitalize(singular)} ${gender === 'f' ? 'supprimée' : 'supprimé'}`;
}

export function buildCreateErrorToast({ singular, gender }: DnEntityIdentifier): string {
    return `Erreur lors de la création ${gender === 'f' ? 'de la' : 'du'} ${singular}`;
}
