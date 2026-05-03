import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import axios from "axios";
import { useState } from "react";
import { buildApiUrl } from '../utils/api';
import * as Yup from 'yup';
import { Formik } from 'formik';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import AnimateButton from '../ui-component/extended/AnimateButton';
import Button from '@mui/material/Button';
import { useNavigate } from "react-router-dom";
 
import Logo from '../ui-component/Logo';

function AuthLogin({ ...others }) {
  const [is_not_found, setis_not_found] = useState('');
  const history = useNavigate();
  const [checked, setChecked] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const currentYear = new Date().getFullYear();

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  async function SignIn(email, password) {
    try {
      const res = await axios.post(buildApiUrl('/api/login'), { email, password });

      if (res.data.token) {
        const token = res.data.token;
        if (token) {

            
          localStorage.setItem('token', token);
          localStorage.setItem('username', email);
          if (typeof res.data.actionUser === 'string') {
            localStorage.setItem('Action_user', res.data.actionUser);
          }
          if (res.data.userSN && typeof res.data.userSN === 'object') {
            localStorage.setItem('userSN', JSON.stringify(res.data.userSN));
          } else {
            localStorage.removeItem('userSN');
          }
          const refEmp = String(
            res.data?.userSN?.ref_emp ??
            res.data?.userSN?.Ref_emp ??
            res.data?.ref_emp ??
            res.data?.Ref_emp ??
            ''
          ).trim();
          if (refEmp) {
            localStorage.setItem('ref_emp', refEmp);
          } else {
            localStorage.removeItem('ref_emp');
          }
          history("/home", { state: { id: email } });
        } else {
          setis_not_found("Login failed: Token is missing!");
        }
      }
    } catch (e) {
     
      setis_not_found("Login or Password is wrong. Please try again!");
    }
  }

  return (
    <Container maxWidth="md" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Grid container spacing={2} alignItems="stretch">
        
        <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Paper elevation={3} sx={{ p: { xs: 4, md: 6 }, display: 'flex', flexDirection: 'column', 
          alignItems: 'center', bgcolor: 'background.paper', minHeight: 480, borderRadius: 7 , borderColor:'ActiveBorder'  }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <Box sx={{ mb: 2, mt: 1, display: 'flex', justifyContent: 'center', width: '100%' }}>
                <Logo />
              </Box>
              <Typography variant="h5" sx={{ mb: 3, color: 'text.primary', textAlign: 'center', fontWeight: 600 }}>Welcome Back!</Typography>
            </Box>
            <Formik
              onSubmit={(values, actions) => {
                setTimeout(() => {
                  SignIn(values.email, values.password);
                  actions.setSubmitting(false);
                }, 500);
              }}
              initialValues={{
                email: '',
                password: '',
              }}
              validationSchema={Yup.object().shape({
                email: Yup.string().email('Must be a valid email').max(255).required('Email is required'),
                password: Yup.string().max(255).required('Password is required')
              })}
            >
              {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
                <Box component="form" noValidate onSubmit={handleSubmit} {...others} sx={{width: '100%' }}>
                  <FormControl fullWidth error={Boolean(touched.email && errors.email)} sx={{ mb: 2 }}>
                    <InputLabel htmlFor="outlined-adornment-email-login">Email Address / Username</InputLabel>
                    <OutlinedInput
                      id="outlined-adornment-email-login"
                      type="email"
                      value={values.email}
                      name="email"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      label="Email Address / Username"
                    />
                    {touched.email && errors.email && (
                      <FormHelperText error id="standard-weight-helper-text-email-login">
                        {errors.email}
                      </FormHelperText>
                    )}
                  </FormControl>
                  <FormControl fullWidth error={Boolean(touched.password && errors.password)}>
                    <InputLabel htmlFor="outlined-adornment-password-login">Password</InputLabel>
                    <OutlinedInput
                      id="outlined-adornment-password-login"
                      type={showPassword ? 'text' : 'password'}
                      value={values.password}
                      name="password"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      endAdornment={
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleClickShowPassword}
                            onMouseDown={handleMouseDownPassword}
                            edge="end"
                          >
                            {showPassword ? <Visibility /> : <VisibilityOff />}
                          </IconButton>
                        </InputAdornment>
                      }
                      label="Password"
                    />
                    {touched.password && errors.password && (
                      <FormHelperText error id="standard-weight-helper-text-password-login">
                        {errors.password}
                      </FormHelperText>
                    )}
                  </FormControl>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mt: 2 }}>
                    <FormControlLabel
                      control={<Checkbox checked={checked} onChange={(event) => setChecked(event.target.checked)} name="checked" color="primary" />}
                      label="Remember me"
                    />
                    <Typography variant="subtitle1" color="secondary" sx={{ textDecoration: 'none', cursor: 'pointer' }}>
                      Forgot Password?
                    </Typography>
                  </Stack>
                  {errors.submit && (
                    <Box sx={{ mt: 3 }}>
                      <FormHelperText error>{errors.submit}</FormHelperText>
                    </Box>
                  )}
                  <Box sx={{ mt: 2 }}>
                    <AnimateButton>
                      <Button disableElevation disabled={isSubmitting} fullWidth size="large" type="submit" variant="contained" color="secondary" sx={{ borderRadius: 2 }}>
                        Sign in
                      </Button>
                    </AnimateButton>
                  </Box>
                </Box>
              )}
            </Formik>
            <Box sx={{ width: '100%', mt: 2 }}>
              <Typography variant="body2" color="error" sx={{ fontStyle: 'italic' }}>{is_not_found}</Typography>
              <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 1 }}>
                We'll never share your email and password with anyone else.
              </Typography>
            </Box>



            
          </Paper>



          <Box
            sx={{
              mt: 4,
              px: 2,
              py: 2,
              borderTop: 1,
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'background.paper'
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              alignItems="center"
              justifyContent="center"
              textAlign="center"
            >
              <Typography variant="body2" color="text.secondary">
                Built by IT Department
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • © {currentYear} NAGECO
              </Typography>
              <Link
                href="https://nageco.com/"
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
                sx={{ fontWeight: 600 }}
              >
                nageco.com
              </Link>
            </Stack>
          </Box>
        </Grid>


      
      </Grid>
      
    </Container>
  );
}

export default AuthLogin;
