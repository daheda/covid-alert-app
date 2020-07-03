import React, {useCallback, useRef, useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import {useI18n} from '@shopify/react-i18n';
import {Box, Button, Text} from 'components';
import {View, LayoutChangeEvent, LayoutRectangle, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Carousel, {CarouselStatic, Pagination} from 'react-native-snap-carousel';
import {useMaxContentWidth} from 'shared/useMaxContentWidth';
import {useStorage} from 'services/StorageService';
import {RegionPickerScreen} from 'screens/regionPicker';
import {useStartExposureNotificationService} from 'services/ExposureNotificationService';

import {Start} from './views/Start';
import {WhatItsNot} from './views/WhatItsNot';
import {Anonymous} from './views/Anonymous';
import {HowItWorks} from './views/HowItWorks';
import {Permissions} from './views/Permissions';

type ViewKey = 'start' | 'whatItsNot' | 'anonymous' | 'howItWorks' | 'permissions' | 'region';

const contentData: ViewKey[] = ['start', 'whatItsNot', 'anonymous', 'howItWorks', 'permissions', 'region'];
const viewComponents = {
  start: Start,
  whatItsNot: WhatItsNot,
  anonymous: Anonymous,
  howItWorks: HowItWorks,
  permissions: Permissions,
  region: RegionPickerScreen,
};

export const BaseOnboardingView = ({children}: {children: React.ReactNode}) => {
  const [i18n] = useI18n();
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef(null);
  const navigation = useNavigation();
  const {region, setRegion, setOnboarded, setOnboardedDatetime} = useStorage();
  const startExposureNotificationService = useStartExposureNotificationService();
  const maxWidth = useMaxContentWidth();

  const renderItem = useCallback(
    ({item}: {item: ViewKey}) => {
      const ItemComponent = viewComponents[item];
      return (
        <Box maxWidth={maxWidth} alignSelf="center">
          <ItemComponent />
        </Box>
      );
    },
    [maxWidth],
  );

  const nextItem = useCallback(async () => {
    if (carouselRef.current) {
      if (currentIndex === contentData.length - 1) {
        await setOnboarded(true);
        await setOnboardedDatetime(new Date());
        navigation.reset({
          index: 0,
          routes: [{name: 'Home'}],
        });

        return;
      }
      (carouselRef.current! as CarouselStatic<ViewKey>).snapToNext();
    }
  }, [currentIndex, navigation, setOnboarded, setOnboardedDatetime]);

  const onSnapToNewPage = (index: number) => {
    // we want the EN permission dialogue to appear on the last step.
    if (index === contentData.length - 1) {
      startExposureNotificationService();
    }

    // we want region cleared on the 2nd last step
    if (index === contentData.length - 2) {
      setRegion(undefined);
    }
  };

  const prevItem = useCallback(() => {
    if (carouselRef.current) {
      (carouselRef.current! as CarouselStatic<ViewKey>).snapToPrev();
    }
  }, []);

  const isStart = currentIndex === 0;
  const isEnd = currentIndex === contentData.length - 1;

  let endText = 'EndSkip';
  let endBtnStyle = '';

  if (isEnd && region && region !== 'None') {
    endText = 'End';
    endBtnStyle = 'ready';
  }

  const BackButton = (
    <Button
      backButton
      text={i18n.translate('Onboarding.ActionBack')}
      color="linkText"
      variant="subduedText"
      onPress={prevItem}
    />
  );

  const [layout, setLayout] = useState<LayoutRectangle | undefined>();
  const onLayout = useCallback(({nativeEvent: {layout}}: LayoutChangeEvent) => {
    setLayout(layout);
  }, []);

  return (
    <Box flex={1} backgroundColor="overlayBackground">
      <SafeAreaView style={styles.flex}>
        <Box flexDirection="row">
          <Box align-self="flex-start" style={isStart ? styles.spacer : null}>
            {isStart ? null : BackButton}
          </Box>
        </Box>

        <Box flex={1} paddingTop="s" justifyContent="center" onLayout={onLayout}>
          {layout && (
            <View style={styles.viewOffset}>
              {/* <Carousel
                ref={carouselRef}
                data={contentData}
                renderItem={renderItem}
                sliderWidth={layout.width}
                itemWidth={layout.width}
                itemHeight={layout.height}
                onSnapToItem={newIndex => {
                  setCurrentIndex(newIndex);
                  onSnapToNewPage(newIndex);
                }}
              /> */}
              <Box height={5} maxHeight={2} borderTopWidth={2} borderTopColor="gray5" />
              {/* <Pagination
                dotContainerStyle={styles.dotContainerStyle}
                activeDotIndex={currentIndex + 1}
                dotsLength={contentData.length}
                renderDots={(activeIndex, total) => {
                  const stepText = i18n.translate('Onboarding.Step');
                  const ofText = i18n.translate('Onboarding.Of');
                  const text = `${stepText} ${activeIndex} ${ofText} ${total}`;
                  return (
                    <Box paddingBottom="xxl" style={styles.dotWrapperStyle}>
                      <Text color="gray2" variant="bodyText">
                        {text}
                      </Text>
                    </Box>
                  );
                }}
              /> */}
              {children}
            </View>
          )}
        </Box>

        <Box paddingHorizontal="m" alignItems="center" justifyContent="center" flexDirection="row" marginBottom="l">
          <Box flex={1}>
            {isEnd ? (
              <Button
                text={i18n.translate(`Onboarding.Action${endText}`)}
                variant={endBtnStyle === 'ready' ? 'thinFlat' : 'thinFlatNeutralGrey'}
                onPress={nextItem}
              />
            ) : (
              <Button text={i18n.translate('Onboarding.ActionNext')} variant="thinFlat" onPress={nextItem} />
            )}
          </Box>
        </Box>
      </SafeAreaView>
    </Box>
  );
};

const styles = StyleSheet.create({
  spacer: {
    marginBottom: 57,
  },
  viewOffset: {
    marginTop: 50,
  },
  flex: {
    flex: 1,
  },
  dotContainerStyle: {},
  dotWrapperStyle: {
    marginBottom: 20,
    fontSize: 20,
  },
});
