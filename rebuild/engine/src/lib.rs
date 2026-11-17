//! Transport proof only: this crate has no game state, rules or save format.

/// Advances a demo value without overflow; this is not a game command.
#[unsafe(no_mangle)]
pub extern "C" fn advance_demo(value: u32) -> u32 {
    value.saturating_add(1)
}

#[cfg(test)]
mod tests {
    use super::advance_demo;

    #[test]
    fn advances_and_never_wraps() {
        assert_eq!(advance_demo(0), 1);
        assert_eq!(advance_demo(41), 42);
        assert_eq!(advance_demo(u32::MAX), u32::MAX);
    }
}
