#import <UIKit/UIKit.h>

#import <React/RCTComponent.h>

NS_ASSUME_NONNULL_BEGIN

@interface RNNextWheelPickerView : UIPickerView

@property (nonatomic, copy) NSArray<NSString *> *displayedValues;
@property (nonatomic, assign) NSInteger selectedIndex;
@property (nonatomic, assign) NSInteger mostRecentEventCount;
@property (nonatomic, assign) BOOL wrapSelectorWheel;
@property (nonatomic, copy, nullable) NSString *themeVariant;
@property (nonatomic, strong, nullable) UIColor *selectionColor;
@property (nonatomic, copy, nullable) NSDictionary *itemStyle;
@property (nonatomic, copy, nullable) RCTBubblingEventBlock onValueChange;

@end

NS_ASSUME_NONNULL_END
