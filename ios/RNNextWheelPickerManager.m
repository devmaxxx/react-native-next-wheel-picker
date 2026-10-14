#import <React/RCTViewManager.h>

#import "RNNextWheelPickerView.h"

@interface RNNextWheelPickerManager : RCTViewManager
@end

@implementation RNNextWheelPickerManager

RCT_EXPORT_MODULE(RNNextWheelPicker)

- (UIView *)view
{
  return [RNNextWheelPickerView new];
}

RCT_EXPORT_VIEW_PROPERTY(displayedValues, NSArray<NSString *>)
RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
RCT_EXPORT_VIEW_PROPERTY(mostRecentEventCount, NSInteger)
RCT_EXPORT_VIEW_PROPERTY(wrapSelectorWheel, BOOL)
RCT_EXPORT_VIEW_PROPERTY(themeVariant, NSString)
RCT_EXPORT_VIEW_PROPERTY(selectionColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(itemStyle, NSDictionary)
RCT_EXPORT_VIEW_PROPERTY(onValueChange, RCTBubblingEventBlock)

@end
