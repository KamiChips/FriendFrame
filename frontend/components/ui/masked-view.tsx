import RNMaskedView from '@react-native-masked-view/masked-view';
import type { ComponentType, ReactElement, ReactNode } from 'react';
import type { ViewProps } from 'react-native';

type MaskedViewProps = ViewProps & {
    maskElement: ReactElement;
    androidRenderingMode?: 'software' | 'hardware';
    children?: ReactNode;
};

// TODO: remove this wrapper when the library's types work with RN 0.88
const MaskedView = RNMaskedView as unknown as ComponentType<MaskedViewProps>;

export default MaskedView;
