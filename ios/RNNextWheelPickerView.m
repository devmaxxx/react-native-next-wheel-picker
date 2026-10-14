#import "RNNextWheelPickerView.h"

#import <React/RCTConvert.h>
#import <React/RCTFont.h>

// Rows a wrapping wheel holds: enough that a user never flicks to an end.
static const NSInteger kWrapRows = 1000;
static const CGFloat kDefaultFontSize = 21;
static const CGFloat kLabelInset = 20;

@interface RNNextWheelPickerView () <UIPickerViewDataSource, UIPickerViewDelegate>
@end

@implementation RNNextWheelPickerView {
  UIFont *_font;
  UIColor *_textColor;
  // The item the wheel shows, and how many changes it has reported. JS echoes
  // the count back, and `selectedIndex` is ignored until it catches up, so a
  // stale index sent before JS saw the last change cannot move the wheel.
  NSInteger _currentIndex;
  NSInteger _eventCount;
  BOOL _rowsDirty;
  BOOL _hasSelected;
  UIView *_band;
  UIColor *_bandDefaultColor;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _displayedValues = @[];
    _font = [UIFont systemFontOfSize:kDefaultFontSize];
    _textColor = UIColor.labelColor;
    self.dataSource = self;
    self.delegate = self;
  }
  return self;
}

#pragma mark - Props

// Every setter only records the change. Under Fabric a controlled wheel gets
// all its props again on each change, and reloading the rows then would
// rebuild them under the user's finger; didSetProps reloads once, if needed.

- (void)setDisplayedValues:(NSArray<NSString *> *)displayedValues
{
  if ([_displayedValues isEqualToArray:displayedValues]) return;
  _displayedValues = [displayedValues copy] ?: @[];
  _rowsDirty = YES;
}

- (void)setWrapSelectorWheel:(BOOL)wrapSelectorWheel
{
  if (_wrapSelectorWheel == wrapSelectorWheel) return;
  _wrapSelectorWheel = wrapSelectorWheel;
  _rowsDirty = YES;
}

- (void)setItemStyle:(NSDictionary *)itemStyle
{
  if (_itemStyle == itemStyle || [_itemStyle isEqualToDictionary:itemStyle]) return;
  _itemStyle = [itemStyle copy];
  // A key missing from a new itemStyle falls back to its default, so dropping
  // a style prop does not leave the old one on screen.
  _font = [RCTFont updateFont:nil
                   withFamily:[RCTConvert NSString:itemStyle[@"fontFamily"]]
                         size:itemStyle[@"fontSize"] ?: @(kDefaultFontSize)
                       weight:[RCTConvert NSString:itemStyle[@"fontWeight"]]
                        style:[RCTConvert NSString:itemStyle[@"fontStyle"]]
                      variant:nil
              scaleMultiplier:1];
  _textColor = itemStyle[@"color"] ? [RCTConvert UIColor:itemStyle[@"color"]] : UIColor.labelColor;
  _rowsDirty = YES;
}

- (void)setThemeVariant:(NSString *)themeVariant
{
  _themeVariant = [themeVariant copy];
  if ([themeVariant isEqualToString:@"dark"]) {
    self.overrideUserInterfaceStyle = UIUserInterfaceStyleDark;
  } else if ([themeVariant isEqualToString:@"light"]) {
    self.overrideUserInterfaceStyle = UIUserInterfaceStyleLight;
  } else {
    self.overrideUserInterfaceStyle = UIUserInterfaceStyleUnspecified;
  }
}

- (void)setSelectionColor:(UIColor *)selectionColor
{
  _selectionColor = selectionColor;
  [self applySelectionColor];
}

- (void)didSetProps:(__unused NSArray<NSString *> *)changedProps
{
  BOOL rowsChanged = _rowsDirty;
  if (_rowsDirty) {
    _rowsDirty = NO;
    [self reloadAllComponents];
  }
  // New rows jump to the value, and so does the first one, as UIPickerView
  // would animate from row 0; any other change scrolls to it.
  [self applyJsIndexAnimated:_hasSelected && !rowsChanged force:rowsChanged];
}

#pragma mark - Selection

- (NSInteger)itemCount
{
  return (NSInteger)_displayedValues.count;
}

- (NSInteger)copies
{
  NSInteger count = [self itemCount];
  return _wrapSelectorWheel && count > 1 ? MAX(3, (kWrapRows + count - 1) / count) : 1;
}

- (NSInteger)middleRowForIndex:(NSInteger)index
{
  return [self copies] / 2 * [self itemCount] + index;
}

// The copy of `index` nearest the row on screen, so a wrapping wheel takes
// the short way round.
- (NSInteger)rowForIndex:(NSInteger)index
{
  NSInteger count = [self itemCount];
  NSInteger copies = [self copies];
  if (copies == 1) return index;
  NSInteger shown = [self selectedRowInComponent:0];
  if (shown < 0) return [self middleRowForIndex:index];
  NSInteger row = shown - shown % count + index;
  if (row - shown > count / 2) row -= count;
  else if (shown - row > count / 2) row += count;
  // Rows in the first or last copy leave no room to keep flicking, so they
  // fall back to the middle copy. This also covers the wheel's initial row 0
  // and rows left over from before a reload.
  return row < count || row >= (copies - 1) * count ? [self middleRowForIndex:index] : row;
}

- (void)applyJsIndexAnimated:(BOOL)animated force:(BOOL)force
{
  NSInteger count = [self itemCount];
  if (count == 0) return;
  // JS has not seen the last change yet, so its index is stale: leave the
  // wheel alone, except to put the user's pick back after a reload.
  BOOL stale = _mostRecentEventCount < _eventCount;
  if (stale && !force) return;
  NSInteger index = MIN(MAX(stale ? _currentIndex : _selectedIndex, 0), count - 1);
  if (!force && _hasSelected && index == _currentIndex) return;
  _currentIndex = index;
  _hasSelected = YES;
  [self selectRow:[self rowForIndex:index] inComponent:0 animated:animated];
}

#pragma mark - Band

- (void)layoutSubviews
{
  [super layoutSubviews];
  [self applySelectionColor];
}

// UIPickerView has no API for its band. It is the subview only a row tall;
// the columns fill the picker.
- (void)applySelectionColor
{
  if (!_band) {
    for (UIView *subview in self.subviews) {
      CGFloat height = subview.bounds.size.height;
      if (height > 0 && height < self.bounds.size.height / 2) {
        _band = subview;
        _bandDefaultColor = subview.backgroundColor;
        break;
      }
    }
  }
  _band.backgroundColor = _selectionColor ?: _bandDefaultColor;
}

#pragma mark - UIPickerViewDataSource

- (NSInteger)numberOfComponentsInPickerView:(__unused UIPickerView *)pickerView
{
  return 1;
}

- (NSInteger)pickerView:(__unused UIPickerView *)pickerView numberOfRowsInComponent:(__unused NSInteger)component
{
  return [self itemCount] * [self copies];
}

#pragma mark - UIPickerViewDelegate

// As @react-native-picker/picker sizes them, so wheels look the same after a switch.
- (CGFloat)pickerView:(__unused UIPickerView *)pickerView rowHeightForComponent:(__unused NSInteger)component
{
  return _font.lineHeight + 20;
}

- (UIView *)pickerView:(UIPickerView *)pickerView
            viewForRow:(NSInteger)row
          forComponent:(NSInteger)component
           reusingView:(UIView *)view
{
  UILabel *label = (UILabel *)view.subviews.firstObject;
  if (![label isKindOfClass:UILabel.class]) {
    CGSize size = [pickerView rowSizeForComponent:component];
    view = [[UIView alloc] initWithFrame:CGRectMake(0, 0, size.width, size.height)];
    label = [[UILabel alloc] initWithFrame:CGRectMake(kLabelInset, 0, MAX(0, size.width - 2 * kLabelInset), size.height)];
    label.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    label.textAlignment = NSTextAlignmentCenter;
    [view addSubview:label];
  }
  label.font = _font;
  label.textColor = _textColor;
  NSInteger count = [self itemCount];
  label.text = count > 0 ? _displayedValues[row % count] : nil;
  return view;
}

- (void)pickerView:(__unused UIPickerView *)pickerView
      didSelectRow:(NSInteger)row
       inComponent:(__unused NSInteger)component
{
  NSInteger count = [self itemCount];
  if (count == 0) return;
  NSInteger index = row % count;
  // Back to the middle copy, out of sight as the rows are identical, so the
  // user can always keep flicking.
  if ([self copies] > 1) {
    [self selectRow:[self middleRowForIndex:index] inComponent:0 animated:NO];
  }
  _currentIndex = index;
  _eventCount += 1;
  if (_onValueChange) {
    _onValueChange(@{@"index" : @(index), @"eventCount" : @(_eventCount)});
  }
}

@end
