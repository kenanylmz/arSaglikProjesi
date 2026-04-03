import {Medicine} from '../types';

export const MEDICINES: Medicine[] = [
  {
    id: 'neoral',
    name: 'Sandimmun Neoral',
    genericName: 'Ciclosporin',
    dosage: '100 mg',
    manufacturer: 'Novartis',
    defaultTimes: ['08:00', '20:00'],
    color: '#F5A623',
    description:
      'Bağışıklık sistemi baskılayıcı. Karaciğer nakli sonrası organ reddini önlemek için kullanılır.',
  },
  {
    id: 'deltacortril',
    name: 'Deltacortril',
    genericName: 'Prednisolone',
    dosage: '5 mg',
    manufacturer: 'Pfizer',
    defaultTimes: ['10:00'],
    color: '#1B3A5C',
    description:
      'Kortikosteroid. Karaciğer nakli sonrası iltihaplanmayı azaltmak ve bağışıklık yanıtını düzenlemek için kullanılır.',
  },
];
